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
        public async Task should_send_messages_to_participants_on_help()
        {
            _eventHandler = new HelpEventHandler(EventHubContextMock.Object, MemoryCache);

            var conference = TestConference;
            var participantCount = conference.Participants.Count + 1; // plus one for admin
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Help,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                TimeStampUtc = DateTime.UtcNow, 
                ParticipantId = conference.Participants.First().Id
            };

            await _eventHandler.HandleAsync(callbackEvent);

            // Verify messages sent to event hub clients
            EventHubClientMock.Verify(x => x.HelpMessage(conference.Id, conference.Participants.First().DisplayName));
        }
    }
}