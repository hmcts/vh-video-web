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
    public class SuspendEventHandlerTests : EventHandlerTestBase
    {
        private SuspendEventHandler _eventHandler;

        [Test]
        public async Task Should_send_messages_to_participants_on_suspended()
        {
            _eventHandler = new SuspendEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object, LoggerMock.Object);

            var conference = TestConference;
            var participantCount = conference.Participants.Count + 1; // plus one for admin
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Pause,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                TimeStampUtc = DateTime.UtcNow,
                ParticipantId = conference.Participants[0].Id
            };

            await _eventHandler.HandleAsync(callbackEvent);

            // Verify messages sent to event hub clients
            EventHubClientMock.Verify(x => x.ConferenceStatusMessage(conference.Id, ConferenceStatus.Suspended),
                Times.Exactly(participantCount));
        }
    }
}
