using System;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Models;

namespace VideoWeb.UnitTests.EventHandlers
{
    public class PauseEventHandlerTests : EventHandlerTestBase
    {
        private PauseEventHandler _eventHandler;

        [Test]
        public async Task should_send_messages_to_participants_on_pause()
        {
            _eventHandler = new PauseEventHandler(EventHubContextMock.Object, MemoryCache, LoggerMock.Object);

            var conference = TestConference;
            var participantCount = conference.Participants.Count + 1; // plus one for admin
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Pause,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                TimeStampUtc = DateTime.UtcNow
            };

            await _eventHandler.HandleAsync(callbackEvent);

            // Verify messages sent to event hub clients
            EventHubClientMock.Verify(x => x.ConferenceStatusMessage(conference.Id, ConferenceState.Paused),
                Times.Exactly(participantCount));
        }
    }
}