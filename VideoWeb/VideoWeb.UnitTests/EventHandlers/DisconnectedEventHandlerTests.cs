using System;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Models;

namespace VideoWeb.UnitTests.EventHandlers
{
    public class DisconnectedEventHandlerTests : EventHandlerTestBase
    {
        private DisconnectedEventHandler _eventHandler;

        [Test]
        public async Task Should_send_disconnect_messages_to_participants_and_service_bus_on_participant_disconnect()
        {
            _eventHandler = new DisconnectedEventHandler(EventHubContextMock.Object, ConferenceCache, LoggerMock.Object);

            var conference = TestConference;
            var participantCount = conference.Participants.Count + 1; // plus one for admin
            var participantForEvent = conference.Participants.First(x => x.Role == UserRole.Individual);
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Disconnected,
                EventId = Guid.NewGuid().ToString(),
                ParticipantId = participantForEvent.Id,
                ConferenceId = conference.Id,
                Reason = "Unexpected drop",
                TimeStampUtc = DateTime.UtcNow
            };

            await _eventHandler.HandleAsync(callbackEvent);

            // Verify messages sent to event hub clients
            EventHubClientMock.Verify(
                x => x.ParticipantStatusMessage(participantForEvent.Id, ParticipantState.Disconnected),
                Times.Exactly(participantCount));
        }

        [Test]
        public async Task
            Should_send_disconnect_and_suspend_messages_to_participants_and_service_bus_on_judge_disconnect()
        {
            _eventHandler = new DisconnectedEventHandler(EventHubContextMock.Object, ConferenceCache, LoggerMock.Object);

            var conference = TestConference;
            var participantCount = conference.Participants.Count + 1; // plus one for admin
            var participantForEvent = conference.Participants.First(x => x.Role == UserRole.Judge);
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Disconnected,
                EventId = Guid.NewGuid().ToString(),
                ParticipantId = participantForEvent.Id,
                ConferenceId = conference.Id,
                TimeStampUtc = DateTime.UtcNow
            };

            await _eventHandler.HandleAsync(callbackEvent);
            // Verify messages sent to event hub clients
            EventHubClientMock.Verify(
                x => x.ParticipantStatusMessage(_eventHandler.SourceParticipant.Id,
                    ParticipantState.Disconnected),
                Times.Exactly(participantCount));

            EventHubClientMock.Verify(
                x => x.ConferenceStatusMessage(conference.Id, ConferenceState.Suspended),
                Times.Exactly(participantCount));
        }
    }
}
