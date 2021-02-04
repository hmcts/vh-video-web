using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using NUnit.Framework;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Models;
using EventType = VideoWeb.EventHub.Enums.EventType;
using EndpointState = VideoWeb.EventHub.Enums.EndpointState;
using RoomType = VideoWeb.Common.Models.RoomType;

namespace VideoWeb.UnitTests.EventHandlers
{
    public class EndpointTransferEventHandlerTests : EventHandlerTestBase
    {
        private EndpointTransferEventHandler _eventHandler;

        [TestCase(RoomType.WaitingRoom, RoomType.HearingRoom, EndpointState.Connected)]
        [TestCase(RoomType.HearingRoom, RoomType.WaitingRoom, EndpointState.Connected)]
        public async Task Should_send_endpoint_status_messages_to_clients(RoomType from, RoomType to,
            EndpointState status)
        {
            _eventHandler = new EndpointTransferEventHandler(EventHubContextMock.Object, ConferenceCache, LoggerMock.Object,
                VideoApiClientMock.Object);
            
            var conference = TestConference;
            var participantCount = conference.Participants.Count + 1; // plus one for admin
            var participantForEvent = conference.Endpoints.First();
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.EndpointTransfer,
                EventId = Guid.NewGuid().ToString(),
                ParticipantId = participantForEvent.Id,
                TransferFrom = from.ToString(),
                TransferTo = to.ToString(),
                ConferenceId = conference.Id,
                Reason = "JVC Connection",
                TimeStampUtc = DateTime.UtcNow
            };
            
            await _eventHandler.HandleAsync(callbackEvent);
            
            // Verify messages sent to event hub clients
            EventHubClientMock.Verify(x => x.EndpointStatusMessage(participantForEvent.Id, conference.Id, status),
                Times.Exactly(participantCount));
        }

        [Test]
        public void Should_throw_exception_when_transfer_cannot_be_mapped_to_endpoint_status_cannot_be_derived()
        {
            _eventHandler = new EndpointTransferEventHandler(EventHubContextMock.Object, ConferenceCache, LoggerMock.Object,
                VideoApiClientMock.Object);
            
            var conference = TestConference;
            var participantForEvent = conference.Endpoints.First();
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.EndpointTransfer,
                EventId = Guid.NewGuid().ToString(),
                ParticipantId = participantForEvent.Id,
                ConferenceId = conference.Id,
                Reason = "JVC Connection",
                TimeStampUtc = DateTime.UtcNow
            };

            Assert.ThrowsAsync<ArgumentException>(() => _eventHandler.HandleAsync(callbackEvent)).Message.Should()
                .Be("No consultation room provided");
            // Verify messages sent to event hub clients
            EventHubClientMock.Verify(x => x.EndpointStatusMessage(participantForEvent.Id, conference.Id, It.IsAny<EndpointState>()),
                Times.Never);
        }
    }
}
