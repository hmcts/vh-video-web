using System;
using System.Linq;
using System.Threading.Tasks;
using NUnit.Framework;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Models;

namespace VideoWeb.UnitTests.EventHandlers
{
    public class HelpEventHandlerTests : EventHandlerTestBase
    {
        private HelpEventHandler _eventHandler;

        [Test]
        public async Task Should_send_messages_to_participants_on_help()
        {
            _eventHandler = new HelpEventHandler(EventHubContextMock.Object, ConferenceService, LoggerMock.Object);

            var conference = TestConferenceDto;
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Help,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                TimeStampUtc = DateTime.UtcNow,
                ParticipantId = conference.Participants[0].Id
            };

            await _eventHandler.HandleAsync(callbackEvent);

            // Verify messages sent to event hub clients
            EventHubClientMock.Verify(x => x.HelpMessage(conference.Id, conference.Participants[0].DisplayName));
        }
    }
}
