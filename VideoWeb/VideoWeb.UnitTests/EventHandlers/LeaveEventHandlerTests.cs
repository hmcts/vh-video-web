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
    public class LeaveEventHandlerTests : EventHandlerTestBase
    {
        private LeaveEventHandler _eventHandler;

        [TestCase(ParticipantStatus.InConsultation)]
        [TestCase(ParticipantStatus.InHearing)]
        public async Task Should_send_available_message_to_participants_and_service_bus_when_participant_leaves_if_they_were_in_consultation_or_hearing(ParticipantStatus currentStatus)
        {
            _eventHandler = new LeaveEventHandler(EventHubContextMock.Object, ConferenceCache, LoggerMock.Object,
                VideoApiClientMock.Object);

            var conference = TestConference;
            var participantForEvent = conference.Participants.First(x => x.Role == Role.Individual);
            participantForEvent.ParticipantStatus = currentStatus;
            var participantCount = conference.Participants.Count + 1; // plus one for admin

            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Leave,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                ParticipantId = participantForEvent.Id,
                TimeStampUtc = DateTime.UtcNow,
                Reason = "Automated"
            };

            await _eventHandler.HandleAsync(callbackEvent);

            EventHubClientMock.Verify(
                x => x.ParticipantStatusMessage(_eventHandler.SourceParticipant.Id, _eventHandler.SourceParticipant.Username, conference.Id,
                    ParticipantState.Disconnected), Times.Exactly(participantCount));
        }

        [TestCase(ParticipantStatus.Available)]
        [TestCase(ParticipantStatus.Disconnected)]
        [TestCase(ParticipantStatus.Joining)]
        [TestCase(ParticipantStatus.None)]
        [TestCase(ParticipantStatus.NotSignedIn)]
        [TestCase(ParticipantStatus.UnableToJoin)]
        public async Task Should_NOT_send_available_message_to_participants_and_service_bus_when_participant_leaves_if_they_were_NOT_in_consultation_or_hearing(ParticipantStatus currentStatus)
        {
            _eventHandler = new LeaveEventHandler(EventHubContextMock.Object, ConferenceCache, LoggerMock.Object,
                VideoApiClientMock.Object);

            var conference = TestConference;
            var participantForEvent = conference.Participants.First(x => x.Role == Role.Individual);
            participantForEvent.ParticipantStatus = currentStatus;
            var participantCount = conference.Participants.Count + 1; // plus one for admin

            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Leave,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                ParticipantId = participantForEvent.Id,
                TimeStampUtc = DateTime.UtcNow,
                Reason = "Automated"
            };

            await _eventHandler.HandleAsync(callbackEvent);

            EventHubClientMock.Verify(
                x => x.ParticipantStatusMessage(_eventHandler.SourceParticipant.Id, _eventHandler.SourceParticipant.Username, conference.Id,
                    ParticipantState.Disconnected), Times.Never);
        }
    }
}
