using System;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Models;

namespace VideoWeb.UnitTests.EventHandlers
{
    public class RecordingConnectionEventHandlerTests : EventHandlerTestBase
    {
        private RecordingConnectionEventHandler _eventHandler;

        [Test]
        public async Task Should_send_do_nothing_when_recording_connection_fails()
        {
            _eventHandler = new RecordingConnectionEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object, LoggerMock.Object);

            var conference = TestConference;
            var participantId = conference.Participants.Find(x => x.Role == VideoWeb.Common.Models.Role.Individual).Id;
            var conferenceId = conference.Id;
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.RecordingConnectionFailed,
                EventId = Guid.NewGuid().ToString(),
                ParticipantId = participantId,
                ConferenceId = conferenceId,
                TimeStampUtc = DateTime.UtcNow
            };

            await _eventHandler.HandleAsync(callbackEvent);

            // Verify messages sent to event hub clients
            EventHubClientMock.Verify(x => x.RecordingConnectionFailed(conferenceId, participantId), Times.Once);

        }
    }
}
