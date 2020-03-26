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
    public class JudgeUnavailableEventHandlerTest : EventHandlerTestBase
    {
        private JudgeUnavailableEventHandler _eventHandler;

        [Test]
        public async Task should_send_unavailable_participant_messages_when_judge_unavailable()
        {
            _eventHandler = new JudgeUnavailableEventHandler(EventHubContextMock.Object, ConferenceCache,
                LoggerMock.Object, VideoApiClientMock.Object);

            var conference = TestConference;
            var participantCount = conference.Participants.Count + 1; // plus one for admin
            var participantForEvent = conference.Participants.First(x => x.Role == UserRole.Judge);
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.JudgeUnavailable,
                EventId = Guid.NewGuid().ToString(),
                ParticipantId = participantForEvent.Id,
                ConferenceId = conference.Id,
                TimeStampUtc = DateTime.UtcNow
            };

            await _eventHandler.HandleAsync(callbackEvent);

            // Verify messages sent to event hub clients
            EventHubClientMock.Verify(
                x => x.ParticipantStatusMessage(participantForEvent.Id, ParticipantState.NotSignedIn),
                Times.Exactly(participantCount));
        }
    }
}
