using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Autofac;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Moq;
using NUnit.Framework;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Services;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Services;

public class ConferenceManagementServiceTests
{
    private ConferenceManagementService _sut;
    public Mock<IHubContext<EventHub.Hub.EventHubPR2079, IEventHubClient>> EventHubContextMock { get; set; }
    public Mock<IEventHubClient> EventHubClientMock { get; set; }
    private Conference _conference;
    private AutoMock _mocker;

    [SetUp]
    public void Setup()
    {
        _conference = new ConferenceCacheModelBuilder().WithJudicialOfficeHolders().WithLinkedParticipantsInRoom()
            .Build();

        EventHubContextMock = new Mock<IHubContext<EventHub.Hub.EventHubPR2079, IEventHubClient>>();
        EventHubClientMock = new Mock<IEventHubClient>();
        
        
        _mocker = AutoMock.GetLoose(builder =>
        {
            builder.RegisterInstance(EventHubContextMock.Object);
            builder.RegisterInstance(EventHubClientMock.Object);
        });

        _mocker.Mock<IConferenceCache>().Setup(x =>
                x.GetOrAddConferenceAsync(_conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
            .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
            .ReturnsAsync(_conference);
        
        RegisterUsersForHubContext(_conference.Participants);
        
        _sut = _mocker.Create<ConferenceManagementService>();
    }
    
    [Test]
    public void should_not_send_message_when_participant_does_not_exist()
    {
        var conferenceId = _conference.Id;
        var participantId = Guid.NewGuid();
        const bool handRaised = true;


        Func<Task> action = async () => await _sut.UpdateParticipantHandStatusInConference(conferenceId, participantId, handRaised);
        action.Should().Throw<ParticipantNotFoundException>();
        
        EventHubClientMock.Verify(
            x => x
                .ParticipantHandRaiseMessage(participantId, _conference.Id, handRaised), Times.Never);
    }
    
    [Test]
    public async Task should_publish_hand_raised_to_participants_and_linked_and_judge()
    {
        var conferenceId = _conference.Id;
        var participant = _conference.Participants.First(x => !x.IsJudge());
        const bool handRaised = true;
        

        await _sut.UpdateParticipantHandStatusInConference(conferenceId, participant.Id, handRaised);
            
            
        var judge = _conference.Participants.Single(x => x.IsJudge());
        EventHubContextMock.Verify(
            x => x.Clients.Group(It.Is<string>(s => s == judge.Username.ToLowerInvariant()))
                .ParticipantHandRaiseMessage(participant.Id, conferenceId, handRaised), Times.Once);
            
        EventHubContextMock.Verify(
            x => x.Clients.Group(participant.Username.ToLowerInvariant())
                .ParticipantHandRaiseMessage(participant.Id, _conference.Id, handRaised), Times.Once);

        foreach (var lp in participant.LinkedParticipants)
        {
            var linkedPat = _conference.Participants.Single(p => p.Id == lp.LinkedId);
            EventHubContextMock.Verify(
                x => x.Clients.Group(linkedPat.Username.ToLowerInvariant())
                    .ParticipantHandRaiseMessage(lp.LinkedId, _conference.Id, handRaised), Times.Once);
        }
    }
    
    [Test]
    public async Task should_publish_hand_raised_to_all_johs_when_one_joh_is_is_raised()
    {
        var conferenceId = _conference.Id;
        var allJohs = _conference.Participants.Where(x => x.IsJudicialOfficeHolder()).ToList();
        var participant = _conference.Participants.First(x => x.IsJudicialOfficeHolder());
        const bool handRaised = true;
     
        await _sut.UpdateParticipantHandStatusInConference(conferenceId, participant.Id, handRaised);
        
        var judge = _conference.Participants.Single(x => x.IsJudge());
            
        EventHubContextMock.Verify(
            x => x.Clients.Group(judge.Username.ToLowerInvariant())
                .ParticipantHandRaiseMessage(participant.Id, _conference.Id, handRaised),  Times.Once);
            
        foreach (var joh in allJohs)
        {
            EventHubContextMock.Verify(
                x => x.Clients.Group(joh.Username.ToLowerInvariant())
                    .ParticipantHandRaiseMessage(joh.Id, _conference.Id, handRaised), Times.Once);
        }
    }

    private void RegisterUsersForHubContext(List<Participant> participants)
    {
        foreach (var participant in participants)
        {
            EventHubContextMock.Setup(x => x.Clients.Group(participant.Username.ToLowerInvariant()))
                .Returns(new Mock<IEventHubClient>().Object);
        }

        EventHubContextMock.Setup(x => x.Clients.Group(EventHub.Hub.EventHubPR2079.VhOfficersGroupName))
            .Returns(new Mock<IEventHubClient>().Object);
    }
}
