using Autofac.Extras.Moq;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoWeb.Helpers;

namespace VideoWeb.UnitTests.Helpers;

class ParticipantsUpdatedEventNotifierTests
{
    private ParticipantsUpdatedEventNotifier _notifier;
    private AutoMock _mocker;
    private Conference _conference;
    private Participant _participant1;
    private Participant _participant2;
    
    [SetUp]
    public void SetUp()
    {
        _mocker = AutoMock.GetLoose();
        _notifier = _mocker.Create<ParticipantsUpdatedEventNotifier>();
        
        _conference = new Conference();
        _conference.Id = Guid.NewGuid();
        _conference.Participants = new List<Participant>();
        
        _participant1 = new Participant();
        _participant1.Id = Guid.NewGuid();
        
        _participant2 = new Participant();
        _participant2.Id = Guid.NewGuid();
        
        _conference.Participants.Add(_participant1);
        _conference.Participants.Add(_participant2);
    }
    
    [Test]
    public async Task Should_send_event()
    {
        // Arrange
        var response1 = new ParticipantResponse();
        response1.Id = _participant1.Id;
        
        
        var response2 = new ParticipantResponse();
        response2.Id = _participant2.Id;
        
        var responseList = new List<ParticipantResponse> { response1, response2 };

        _mocker.Mock<IEventHandlerFactory>()
            .Setup(x => x.Get(It.Is<EventType>(eventType => eventType == EventType.ParticipantsUpdated)))
            .Returns(_mocker.Mock<IEventHandler>().Object);
        
        // Act
        await _notifier.PushParticipantsUpdatedEvent(_conference, _conference.Participants);
        
        
        _mocker.Mock<IEventHandler>().Verify(x => x.HandleAsync(It.Is<CallbackEvent>(c => c.EventType == EventType.ParticipantsUpdated && c.ConferenceId == _conference.Id && ParticipantResponseListsMatch(c.Participants, responseList))), Times.Once);
    }
    
    [Test]
    public async Task Should_send_event_when_participants_to_notify_specified()
    {
        // Arrange
        var participant1ToNotify = new Participant();
        participant1ToNotify.Id = _participant1.Id;
        
        var participant2ToNotify = new Participant();
        participant2ToNotify.Id = _participant2.Id;
        
        var participant3 = new Participant();
        participant3.Id = Guid.NewGuid();
        
        _conference.Participants.Add(participant3);
        
        var participant3ToNotify = new Participant();
        participant3ToNotify.Id = participant3.Id;
        
        var participantsToNotify = new List<Participant> { participant1ToNotify, participant2ToNotify, participant3ToNotify };
        
        var participant1Mapped = new ParticipantResponse();
        participant1Mapped.Id = _participant1.Id;
        
        var participant2Mapped = new ParticipantResponse();
        participant2Mapped.Id = _participant2.Id;
        
        var participant1ToNotifyMapped = new ParticipantResponse();
        participant1ToNotifyMapped.Id = participant1ToNotify.Id;
        
        var participant2ToNotifyMapped = new ParticipantResponse();
        participant2ToNotifyMapped.Id = participant2ToNotify.Id;
        
        var participant3ToNotifyMapped = new ParticipantResponse();
        participant3ToNotifyMapped.Id = participant3ToNotify.Id;
        
        var participantsToNotifyMapped = new List<ParticipantResponse> { participant1ToNotifyMapped, participant2ToNotifyMapped, participant3ToNotifyMapped };
        
        _mocker.Mock<IEventHandlerFactory>()
            .Setup(x => x.Get(It.Is<EventType>(eventType => eventType == EventType.ParticipantsUpdated)))
            .Returns(_mocker.Mock<IEventHandler>().Object);
        
        // Act
        await _notifier.PushParticipantsUpdatedEvent(_conference, participantsToNotify);
        
        
        _mocker.Mock<IEventHandler>().Verify(x => x.HandleAsync(It.Is<CallbackEvent>(c => c.EventType == EventType.ParticipantsUpdated && c.ConferenceId == _conference.Id
            && ParticipantResponseListsMatch(c.Participants, participantsToNotifyMapped))), Times.Once);
    }
    
    private static bool ParticipantResponseListsMatch(List<ParticipantResponse> list1, List<ParticipantResponse> list2)
    {
        return list1.Any(x => list2.Any(y => x.Id == y.Id)) &&
               list2.Any(x => list1.Any(y => x.Id == y.Id));
    }
}
