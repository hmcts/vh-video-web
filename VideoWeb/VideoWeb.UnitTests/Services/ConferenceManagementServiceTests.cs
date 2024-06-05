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
using VideoWeb.Common;
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
    public Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>> EventHubContextMock { get; set; }
    public Mock<IEventHubClient> EventHubClientMock { get; set; }
    private ConferenceDto _conferenceDto;
    private AutoMock _mocker;

    [SetUp]
    public void Setup()
    {
        _conferenceDto = new ConferenceCacheModelBuilder().WithJudicialOfficeHolders().WithLinkedParticipantsInRoom()
            .Build();

        EventHubContextMock = new Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>();
        EventHubClientMock = new Mock<IEventHubClient>();
        
        
        _mocker = AutoMock.GetLoose(builder =>
        {
            builder.RegisterInstance(EventHubContextMock.Object);
            builder.RegisterInstance(EventHubClientMock.Object);
        });

        _mocker.Mock<IConferenceService>().Setup(x => x.GetConference(_conferenceDto.Id)).ReturnsAsync(_conferenceDto);
        RegisterUsersForHubContext(_conferenceDto.Participants);
        
        _sut = _mocker.Create<ConferenceManagementService>();
    }
    
    [Test]
    public void should_not_send_message_when_participant_does_not_exist()
    {
        var conferenceId = _conferenceDto.Id;
        var participantId = Guid.NewGuid();
        const bool handRaised = true;


        var action = async () => await _sut.UpdateParticipantHandStatusInConference(conferenceId, participantId, handRaised);
        action.Should().ThrowAsync<ParticipantNotFoundException>();
        
        EventHubClientMock.Verify(
            x => x
                .ParticipantHandRaiseMessage(participantId, _conferenceDto.Id, handRaised), Times.Never);
    }
    
    [Test]
    public async Task should_publish_hand_raised_to_participants_and_linked_and_judge()
    {
        var conferenceId = _conferenceDto.Id;
        var participant = _conferenceDto.Participants.First(x => !x.IsJudge());
        const bool handRaised = true;
        

        await _sut.UpdateParticipantHandStatusInConference(conferenceId, participant.Id, handRaised);
            
            
        var judge = _conferenceDto.Participants.Single(x => x.IsJudge());
        EventHubContextMock.Verify(
            x => x.Clients.Group(It.Is<string>(s => string.Equals(s, judge.Username.ToLowerInvariant())))
                .ParticipantHandRaiseMessage(participant.Id, conferenceId, handRaised), Times.Once);
            
        EventHubContextMock.Verify(
            x => x.Clients.Group(participant.Username.ToLowerInvariant())
                .ParticipantHandRaiseMessage(participant.Id, _conferenceDto.Id, handRaised), Times.Once);

        foreach (var lp in participant.LinkedParticipants)
        {
            var linkedPat = _conferenceDto.Participants.Single(p => p.Id == lp.LinkedId);
            EventHubContextMock.Verify(
                x => x.Clients.Group(linkedPat.Username.ToLowerInvariant())
                    .ParticipantHandRaiseMessage(lp.LinkedId, _conferenceDto.Id, handRaised), Times.Once);
        }
    }
    
    [Test]
    public async Task should_publish_hand_raised_to_all_johs_when_one_joh_is_is_raised()
    {
        var conferenceId = _conferenceDto.Id;
        var allJohs = _conferenceDto.Participants.Where(x => x.IsJudicialOfficeHolder()).ToList();
        var participant = _conferenceDto.Participants.First(x => x.IsJudicialOfficeHolder());
        const bool handRaised = true;
     
        await _sut.UpdateParticipantHandStatusInConference(conferenceId, participant.Id, handRaised);
        
        var judge = _conferenceDto.Participants.Single(x => x.IsJudge());
            
        EventHubContextMock.Verify(
            x => x.Clients.Group(judge.Username.ToLowerInvariant())
                .ParticipantHandRaiseMessage(participant.Id, _conferenceDto.Id, handRaised),  Times.Once);
            
        foreach (var joh in allJohs)
        {
            EventHubContextMock.Verify(
                x => x.Clients.Group(joh.Username.ToLowerInvariant())
                    .ParticipantHandRaiseMessage(joh.Id, _conferenceDto.Id, handRaised), Times.Once);
        }
    }

    private void RegisterUsersForHubContext(List<ParticipantDto> participants)
    {
        foreach (var participant in participants)
        {
            EventHubContextMock.Setup(x => x.Clients.Group(participant.Username.ToLowerInvariant()))
                .Returns(new Mock<IEventHubClient>().Object);
        }

        EventHubContextMock.Setup(x => x.Clients.Group(EventHub.Hub.EventHub.VhOfficersGroupName))
            .Returns(new Mock<IEventHubClient>().Object);
    }
}
