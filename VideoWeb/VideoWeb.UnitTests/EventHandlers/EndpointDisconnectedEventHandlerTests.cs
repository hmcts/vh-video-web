using System;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Models;

namespace VideoWeb.UnitTests.EventHandlers
{
    public class EndpointDisconnectedEventHandlerTests : EventHandlerTestBase
    {
        private EndpointDisconnectedEventHandler _eventHandler;

        [Test]
        public async Task should_send_endpoint_disconnected_message_to_participants_and_admin()
        {
            _eventHandler = new EndpointDisconnectedEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object, LoggerMock.Object);
            
            var conference = TestConference;
            var participantCount = conference.Participants.Count + 1; // plus one for admin
            var participantForEvent = conference.Endpoints[0];
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.EndpointDisconnected,
                EventId = Guid.NewGuid().ToString(),
                ParticipantId = participantForEvent.Id,
                ConferenceId = conference.Id,
                Reason = "Unexpected drop",
                TimeStampUtc = DateTime.UtcNow
            };
            
            await _eventHandler.HandleAsync(callbackEvent);
            
            // Verify messages sent to event hub clients
            EventHubClientMock.Verify(x => x.EndpointStatusMessage(participantForEvent.Id, conference.Id, EndpointState.Disconnected), Times.Exactly(participantCount));
            TestConference.Endpoints.Find(x => x.Id == participantForEvent.Id).EndpointStatus.Should().Be(EndpointStatus.Disconnected);
        }
    }
}
