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
    public class EndpointJoinedEventHandlerTests : EventHandlerTestBase
    {
        private EndpointJoinedEventHandler _eventHandler;

        [Test]
        public async Task should_send_endpoint_connected_message_to_participants_and_admin()
        {
            _eventHandler = new EndpointJoinedEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object, LoggerMock.Object);
            
            var conference = TestConference;
            var participantCount = conference.Participants.Count + 1; // plus one for admin
            var participantForEvent = conference.Endpoints[0];
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.EndpointJoined,
                EventId = Guid.NewGuid().ToString(),
                ParticipantId = participantForEvent.Id,
                ConferenceId = conference.Id,
                Reason = "JVC Connection",
                TimeStampUtc = DateTime.UtcNow
            };
            
            await _eventHandler.HandleAsync(callbackEvent);
            
            // Verify messages sent to event hub clients
            EventHubClientMock.Verify(
                x => x.EndpointStatusMessage(participantForEvent.Id, conference.Id, EndpointState.Connected),
                Times.Exactly(participantCount));
            TestConference.Endpoints.Find(x => x.Id == participantForEvent.Id).EndpointStatus.Should().Be(EndpointStatus.Connected);
        }
        
        [Test]
        public async Task should_send_endpoint_connected_message_to_participants_and_admin_despite_being_an_older_event()
        {
            _eventHandler = new EndpointJoinedEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object, LoggerMock.Object);
            
            var conference = TestConference;
            var participantCount = conference.Participants.Count + 1; // plus one for admin
            var participantForEvent = conference.Endpoints[0];
            participantForEvent.LastEventTime = DateTime.UtcNow.AddMilliseconds(1);
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.EndpointJoined,
                EventId = Guid.NewGuid().ToString(),
                ParticipantId = participantForEvent.Id,
                ConferenceId = conference.Id,
                Reason = "JVC Connection",
                TimeStampUtc = DateTime.UtcNow.AddMilliseconds(-1)
            };
            
            await _eventHandler.HandleAsync(callbackEvent);
            
            // Verify messages sent to event hub clients
            EventHubClientMock.Verify(
                x => x.EndpointStatusMessage(participantForEvent.Id, conference.Id, EndpointState.Connected),
                Times.Exactly(participantCount));
            TestConference.Endpoints.Find(x => x.Id == participantForEvent.Id).EndpointStatus.Should().Be(EndpointStatus.Connected);
        }
    }
}
