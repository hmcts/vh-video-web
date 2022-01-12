using Moq;
using NUnit.Framework;
using System;
using System.Threading.Tasks;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Models;

namespace VideoWeb.UnitTests.EventHandlers
{
    public class NewConferenceAddedEventHandlerTests : EventHandlerTestBase
    {
        private NewConferenceAddedEventHandler _eventHandler;

        [Test]
        public async Task Publish_New_Conference_Added_Event()
        {
            _eventHandler = new NewConferenceAddedEventHandler(EventHubContextMock.Object, ConferenceCache, LoggerMock.Object,
                VideoApiClientMock.Object);

            var conference = TestConference;
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.NewConferenceAdded,
                ConferenceId = conference.Id,
                EventId = Guid.NewGuid().ToString(),
                TimeStampUtc = DateTime.UtcNow
            };

            await _eventHandler.HandleAsync(callbackEvent);

            EventHubClientMock.Verify(x => x.NewConferenceAddedMessage(callbackEvent.ConferenceId), Times.Once);
        } 
    }
}
