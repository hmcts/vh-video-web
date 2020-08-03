using System;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Models;

namespace VideoWeb.UnitTests.EventHandlers
{
    public class CountdownFinishedEventHandlerTests : EventHandlerTestBase
    {
        private CountdownFinishedEventHandler _eventHandler;
        
        [Test]
        public async Task Should_send_messages_to_participants_on_pause()
        {
            _eventHandler = new CountdownFinishedEventHandler(EventHubContextMock.Object, ConferenceCache, LoggerMock.Object,
                VideoApiClientMock.Object);

            var conference = TestConference;
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.CountdownFinished,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                TimeStampUtc = DateTime.UtcNow
            };

            await _eventHandler.HandleAsync(callbackEvent);

            // Verify messages sent to event hub clients
            EventHubClientMock.Verify(x => x.ConferenceStatusMessage(conference.Id, It.IsAny<ConferenceStatus>()),
                Times.Never);
        }
    }
}
