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
    public class JudgeAvailableEventHandlerTests : EventHandlerTestBase
    {
        private JudgeAvailableEventHandler _eventHandler;

        [Test]
        public async Task Should_send_available_participant_messages_when_judge_available()
        {
            _eventHandler = new JudgeAvailableEventHandler(EventHubContextMock.Object, ConferenceCache,
                LoggerMock.Object, VideoApiClientMock.Object);

            var conference = TestConference;
            var participantCount = conference.Participants.Count + 1; // plus one for admin
            var participantForEvent = conference.Participants.First(x => x.Role == Role.Judge);
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.JudgeAvailable,
                EventId = Guid.NewGuid().ToString(),
                ParticipantId = participantForEvent.Id,
                ConferenceId = conference.Id,
                TimeStampUtc = DateTime.UtcNow
            };

            await _eventHandler.HandleAsync(callbackEvent);

            // Verify messages sent to event hub clients
            EventHubClientMock.Verify(
                x => x.ParticipantStatusMessage(participantForEvent.Id, participantForEvent.Username, conference.Id, ParticipantState.Available),
                Times.Exactly(participantCount));
        }
    }
}
