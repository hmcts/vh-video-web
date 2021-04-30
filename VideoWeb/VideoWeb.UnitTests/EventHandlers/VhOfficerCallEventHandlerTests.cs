using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Models;
using VideoApi.Contract.Requests;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.UnitTests.EventHandlers
{
    public class VhOfficerCallEventHandlerTests : EventHandlerTestBase
    {
        private VhOfficerCallEventHandler _eventHandler;

        [TestCase(null)]
        [TestCase(RoomType.AdminRoom)]
        [TestCase(RoomType.HearingRoom)]
        [TestCase(RoomType.WaitingRoom)]
        public void Should_throw_exception_when_transfer_to_is_not_a_consultation_room(RoomType? transferTo)
        {
            _eventHandler = new VhOfficerCallEventHandler(EventHubContextMock.Object, ConferenceCache,
                LoggerMock.Object, VideoApiClientMock.Object);

            var conference = TestConference;
            var participantForEvent = conference.Participants.First(x => x.Role == Role.Individual);


            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Transfer,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                ParticipantId = participantForEvent.Id,
                TransferTo = transferTo?.ToString(),
                TimeStampUtc = DateTime.UtcNow
            };

            var exception =
                Assert.ThrowsAsync<ArgumentException>(async () => await _eventHandler.HandleAsync(callbackEvent));
            exception.Message.Should().Be("No consultation room provided");
        }

        [Test]
        public async Task should_send_consultation_message_when_vho_call_starts()
        {
            _eventHandler = new VhOfficerCallEventHandler(EventHubContextMock.Object, ConferenceCache,
                LoggerMock.Object, VideoApiClientMock.Object);
            
            var conference = TestConference;
            var participantForEvent = conference.Participants.First(x => x.Role == Role.Individual);
            var expectedInvitationId = Guid.NewGuid();

            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.VhoCall,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                ParticipantId = participantForEvent.Id,
                TransferTo = "ConsultationRoom1",
                TimeStampUtc = DateTime.UtcNow,
                ConsultationInvitationId = expectedInvitationId
            };
            
            await _eventHandler.HandleAsync(callbackEvent);
            
            // Verify messages sent to event hub clients
            EventHubClientMock.Verify(
                x => x.RequestedConsultationMessage(conference.Id, callbackEvent.ConsultationInvitationId.Value, callbackEvent.TransferTo, It.IsAny<Guid>(),
                    _eventHandler.SourceParticipant.Id), Times.Once);
        }


        [Test]
        public async Task should_join_jvs_to_consultation_when_vho_call_starts()
        {
            // Arrange
            _eventHandler = new VhOfficerCallEventHandler(EventHubContextMock.Object, ConferenceCache,
                LoggerMock.Object, VideoApiClientMock.Object);

            var conference = TestConference;
            var endpointForEvent = conference.Endpoints.First();


            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.VhoCall,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                ParticipantId = endpointForEvent.Id,
                TransferTo = "ConsultationRoom1",
                TimeStampUtc = DateTime.UtcNow
            };

            // Act
            await _eventHandler.HandleAsync(callbackEvent);

            // Assert
            VideoApiClientMock.Verify(x => x.JoinEndpointToConsultationAsync(It.Is<EndpointConsultationRequest>(r => 
            r.ConferenceId == conference.Id &&
            r.RequestedById == Guid.Empty &&
            r.EndpointId == endpointForEvent.Id &&
            r.RoomLabel == callbackEvent.TransferTo)), Times.Once);
        }
    }
}
