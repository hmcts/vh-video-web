using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Autofac;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Moq;
using NUnit.Framework;
using VideoWeb.Common;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Services;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Services;

public class ConferenceManagementServiceTests
{
    private ConferenceManagementService _sut;
    private Mock<IHubContext<EventHub.Hub.EventHubVIH11189, IEventHubClient>> EventHubContextMock { get; set; }
    private Mock<IEventHubClient> EventHubClientMock { get; set; }
    private Conference _conference;
    private AutoMock _mocker;

    [SetUp]
    public void Setup()
    {
        _conference = new ConferenceCacheModelBuilder().WithJudicialOfficeHolders().WithLinkedParticipantsInRoom()
            .Build();

        EventHubContextMock = new Mock<IHubContext<EventHub.Hub.EventHubVIH11189, IEventHubClient>>();
        EventHubClientMock = new Mock<IEventHubClient>();
        
        
        _mocker = AutoMock.GetLoose(builder =>
        {
            builder.RegisterInstance(EventHubContextMock.Object);
            builder.RegisterInstance(EventHubClientMock.Object);
        });

        _mocker.Mock<IConferenceService>().Setup(x => x.GetConference(_conference.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(_conference);
        RegisterUsersForHubContext(_conference.Id, _conference.Participants);
        
        _sut = _mocker.Create<ConferenceManagementService>();
    }
    
    [Test]
    public void UpdateParticipantHandStatusInConference_should_not_send_message_when_participant_does_not_exist()
    {
        var conferenceId = _conference.Id;
        var participantId = Guid.NewGuid();
        const bool handRaised = true;


        var action = async () => await _sut.UpdateParticipantHandStatusInConference(conferenceId, participantId, handRaised);
        action.Should().ThrowAsync<ParticipantNotFoundException>();
        
        EventHubClientMock.Verify(
            x => x
                .ParticipantHandRaiseMessage(participantId, _conference.Id, handRaised), Times.Never);
    }
    
    [Test]
    public async Task UpdateParticipantHandStatusInConference_should_publish_hand_raised_to_participants_and_linked_and_judge()
    {
        var conferenceId = _conference.Id;
        var participant = _conference.Participants.First(x => !x.IsJudge());
        const bool handRaised = true;
        

        await _sut.UpdateParticipantHandStatusInConference(conferenceId, participant.Id, handRaised);
            
            
        var judge = _conference.Participants.Single(x => x.IsJudge());
        EventHubContextMock.Verify(
            x => x.Clients.Group(It.Is<string>(s => string.Equals(s, judge.Username.ToLowerInvariant())))
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
    public async Task UpdateParticipantHandStatusInConference_should_publish_hand_raised_to_all_johs_when_one_joh_is_is_raised()
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

    [Test]
    public async Task ParticipantLeaveConferenceAsync_should_throw_exception_when_participant_does_not_exist()
    {
        var conferenceId = _conference.Id;
        var participantId = "non-existent-participant";
        
        var action = async () => await _sut.ParticipantLeaveConferenceAsync(conferenceId, participantId);
        await action.Should().ThrowAsync<ParticipantNotFoundException>();
        
        EventHubClientMock.Verify(
            x => x.NonHostTransfer(conferenceId, It.IsAny<Guid>(), TransferDirection.Out), Times.Never);
    }
    
    [Test]
    public async Task ParticipantLeaveConferenceAsync_should_publish_non_host_transfer_message()
    {
        var conferenceId = _conference.Id;
        var participant = _conference.Participants.First(x => !x.IsJudge());
        
        await _sut.ParticipantLeaveConferenceAsync(conferenceId, participant.Username);
        
        foreach (var conferenceParticipant in _conference.Participants)
        {
            EventHubContextMock.Verify(
                x => x.Clients.Group(conferenceParticipant.Username.ToLowerInvariant())
                    .NonHostTransfer(conferenceId, participant.Id, TransferDirection.Out), Times.Once);
        }
        
        EventHubContextMock.Verify(
            x => x.Clients.Group(conferenceId.ToString())
                .NonHostTransfer(conferenceId, participant.Id, TransferDirection.Out), Times.Once);
    }
    
    private void RegisterUsersForHubContext(Guid conferenceId, List<Participant> participants)
    {
        foreach (var participant in participants)
        {
            EventHubContextMock.Setup(x => x.Clients.Group(participant.Username.ToLowerInvariant()))
                .Returns(new Mock<IEventHubClient>().Object);
        }

        EventHubContextMock.Setup(x => x.Clients.Group(EventHub.Hub.EventHubVIH11189.VhOfficersGroupName))
            .Returns(new Mock<IEventHubClient>().Object);

        EventHubContextMock.Setup(x => x.Clients.Group(conferenceId.ToString()))
            .Returns(new Mock<IEventHubClient>().Object);
    }
}
