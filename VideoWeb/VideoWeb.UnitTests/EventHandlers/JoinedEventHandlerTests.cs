using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using NUnit.Framework;
using VideoApi.Contract.Enums;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Models;
using EventType = VideoWeb.EventHub.Enums.EventType;
using ParticipantState = VideoWeb.EventHub.Enums.ParticipantState;

namespace VideoWeb.UnitTests.EventHandlers
{
    public class JoinedEventHandlerTests : EventHandlerTestBase
    {
        private JoinedEventHandler _eventHandler;

        [Test]
        public async Task Should_send_available_message_to_participants_and_service_bus_when_participant_joins()
        {
            MemoryCache.Remove(TestConference.Id);

            _eventHandler = new JoinedEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object,
                LoggerMock.Object);

            var conference = TestConference;
            var participantForEvent = conference.Participants.First(x => x.Role == Role.Individual);
            var participantCount = conference.Participants.Count + 1; // plus one for admin

            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Joined,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                ParticipantId = participantForEvent.Id,
                TimeStampUtc = DateTime.UtcNow
            };

            await _eventHandler.HandleAsync(callbackEvent);

            EventHubClientMock.Verify(
                x => x.ParticipantStatusMessage(_eventHandler.SourceParticipant.Id,
                    _eventHandler.SourceParticipant.Username, conference.Id,
                    ParticipantState.Available, callbackEvent.Reason), Times.Exactly(participantCount));

            ConferenceServiceMock.Verify(x => x.GetConference(TestConference.Id, It.IsAny<CancellationToken>()),
                Times.Once);
            TestConference.Participants.Find(x=> x.Id == participantForEvent.Id).ParticipantStatus.Should().Be(ParticipantStatus.Available);
        }
        
        [Test]
        public async Task Should_send_available_message_to_participants_and_service_bus_when_participant_joins_despite_being_older_event()
        {
            MemoryCache.Remove(TestConference.Id);

            _eventHandler = new JoinedEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object,
                LoggerMock.Object);

            var conference = TestConference;
            var participantForEvent = conference.Participants.First(x => x.Role == Role.Individual);
            participantForEvent.LastEventTime = DateTime.UtcNow.AddMilliseconds(1);
            var participantCount = conference.Participants.Count + 1; // plus one for admin

            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Joined,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                ParticipantId = participantForEvent.Id,
                TimeStampUtc = DateTime.UtcNow.AddMilliseconds(-1)
            };

            await _eventHandler.HandleAsync(callbackEvent);

            EventHubClientMock.Verify(
                x => x.ParticipantStatusMessage(_eventHandler.SourceParticipant.Id,
                    _eventHandler.SourceParticipant.Username, conference.Id,
                    ParticipantState.Available, callbackEvent.Reason), Times.Exactly(participantCount));

            ConferenceServiceMock.Verify(x => x.GetConference(TestConference.Id, It.IsAny<CancellationToken>()),
                Times.Once);
            TestConference.Participants.Find(x=> x.Id == participantForEvent.Id).ParticipantStatus.Should().Be(ParticipantStatus.Available);
        }

        [Test]
        public async Task Should_send_in_hearing_message_to_participants_and_service_bus_when_participant_joins()
        {
            MemoryCache.Remove(TestConference.Id);

            _eventHandler = new JoinedEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object,
                LoggerMock.Object);

            var conference = TestConference;
            var participantForEvent = conference.Participants.First(x => x.Role == Role.Individual);
            var participantCount = conference.Participants.Count + 1; // plus one for admin

            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Joined,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                ParticipantId = participantForEvent.Id,
                TimeStampUtc = DateTime.UtcNow,
                IsParticipantInVmr = true,
                ConferenceStatus = ConferenceState.InSession
            };

            await _eventHandler.HandleAsync(callbackEvent);

            EventHubClientMock.Verify(
                x => x.ParticipantStatusMessage(_eventHandler.SourceParticipant.Id,
                    _eventHandler.SourceParticipant.Username, conference.Id,
                    ParticipantState.InHearing, callbackEvent.Reason), Times.Exactly(participantCount));

            ConferenceServiceMock.Verify(x => x.GetConference(TestConference.Id, It.IsAny<CancellationToken>()),
                Times.Once);
            TestConference.Participants.Find(x=> x.Id == participantForEvent.Id).ParticipantStatus.Should().Be(ParticipantStatus.InHearing);
        }

        [Test]
        public async Task
            Should_send_in_consultation_message_to_participants_and_service_bus_when_participant_joins_consultation()
        {
            MemoryCache.Remove(TestConference.Id);

            _eventHandler = new JoinedEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object,
                LoggerMock.Object);

            var conference = TestConference;
            var participantForEvent = conference.Participants.First(x => x.Role == Role.Individual);
            var participantCount = conference.Participants.Count + 1; // plus one for admin

            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Joined,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                ParticipantId = participantForEvent.Id,
                TimeStampUtc = DateTime.UtcNow,
                IsParticipantInVmr = false,
                ConferenceStatus = ConferenceState.Paused,
                IsOtherParticipantsInConsultationRoom = true
            };

            await _eventHandler.HandleAsync(callbackEvent);

            EventHubClientMock.Verify(
                x => x.ParticipantStatusMessage(_eventHandler.SourceParticipant.Id,
                    _eventHandler.SourceParticipant.Username, conference.Id,
                    ParticipantState.InConsultation, callbackEvent.Reason), Times.Exactly(participantCount));

            ConferenceServiceMock.Verify(x => x.GetConference(TestConference.Id, It.IsAny<CancellationToken>()),
                Times.Once);
            TestConference.Participants.Find(x=> x.Id == participantForEvent.Id).ParticipantStatus.Should().Be(ParticipantStatus.InConsultation);
        }
    }
}
