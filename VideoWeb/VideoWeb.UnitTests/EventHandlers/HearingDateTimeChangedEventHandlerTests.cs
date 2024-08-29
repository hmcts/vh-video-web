using System;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Models;

namespace VideoWeb.UnitTests.EventHandlers
{
    public class HearingDateTimeChangedEventHandlerTests : EventHandlerTestBase
    {
        private HearingDateTimeChangedEventHandler _eventHandler;

        [Test]
        public async Task should_publish_message()
        {
            _eventHandler = new HearingDateTimeChangedEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object, LoggerMock.Object);

            var conference = TestConference;
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.HearingDateTimeChanged,
                ConferenceId = conference.Id,
                EventId = Guid.NewGuid().ToString(),
                TimeStampUtc = DateTime.UtcNow
            };

            await _eventHandler.HandleAsync(callbackEvent);
            
            const int vhoCount = 1;
            EventHubClientMock.Verify(x => x.HearingDateTimeChangedMessage(callbackEvent.ConferenceId), Times.Exactly(TestConference.Participants.Count + vhoCount));
        } 
    }
}
