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
            _eventHandler = new EndpointTransferEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object, LoggerMock.Object);
            
            var conference = TestConference;
            var participantCount = conference.Participants.Count + 1; // plus one for admin
            var participantForEvent = conference.Endpoints[0];
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
            EventHubClientMock.Verify(x => x.EndpointStatusMessage(participantForEvent.Id, conference.Id, status),
                Times.Exactly(participantCount));
        }

        [Test]
        public async Task Should_send_endpoint_status_messages_to_clients_when_transferring_to_new_consultation_room()
        {
            _eventHandler = new EndpointTransferEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object, LoggerMock.Object);
            
            var conference = TestConference;
            var participantCount = conference.Participants.Count + 1; // plus one for admin
            var participantForEvent = conference.Endpoints.First();
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.EndpointTransfer,
                EventId = Guid.NewGuid().ToString(),
                ParticipantId = participantForEvent.Id,
                TransferFrom = "WaitingRoom",
                TransferTo = "JudgeConsultationRoom3",
                ConferenceId = conference.Id,
                Reason = "JVC Connection",
                TimeStampUtc = DateTime.UtcNow
            };
            
            await _eventHandler.HandleAsync(callbackEvent);
            EventHubClientMock.Verify(x => x.EndpointStatusMessage(participantForEvent.Id, conference.Id, EndpointState.InConsultation),
                Times.Exactly(participantCount));
            
            // Verify the conference cache has been updated
            conference.ConsultationRooms.Count.Should().Be(1);
            var consultationRoom = conference.ConsultationRooms[0];
            consultationRoom.Label.Should().Be(callbackEvent.TransferTo);
            consultationRoom.Locked.Should().Be(true);
            participantForEvent.CurrentRoom.Should().Be(consultationRoom);
        }

        [Test]
        public async Task Should_send_endpoint_status_messages_to_clients_when_transferring_to_existing_consultation_room()
        {
            // ie we are transferring into a room with participants or endpoints already in it
            _eventHandler = new EndpointTransferEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object, LoggerMock.Object);
            
            var conference = TestConference;
            var participantCount = conference.Participants.Count + 1; // plus one for admin
            var participantForEvent = conference.Endpoints.First();
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.EndpointTransfer,
                EventId = Guid.NewGuid().ToString(),
                ParticipantId = participantForEvent.Id,
                TransferFrom = "WaitingRoom",
                TransferTo = "JudgeConsultationRoom3",
                ConferenceId = conference.Id,
                Reason = "JVC Connection",
                TimeStampUtc = DateTime.UtcNow
            };

            foreach (var participant in conference.Participants)
            {
                conference.AddParticipantToConsultationRoom(callbackEvent.TransferTo, participant);
            }
            
            await _eventHandler.HandleAsync(callbackEvent);
            EventHubClientMock.Verify(x => x.EndpointStatusMessage(participantForEvent.Id, conference.Id, EndpointState.InConsultation),
                Times.Exactly(participantCount));
            
            // Verify the conference cache has been updated
            conference.ConsultationRooms.Count.Should().Be(1);
            var consultationRoom = conference.ConsultationRooms[0];
            consultationRoom.Label.Should().Be(callbackEvent.TransferTo);
            consultationRoom.Locked.Should().Be(true);
            participantForEvent.CurrentRoom.Should().Be(consultationRoom);
        }
        
        [Test]
        public async Task Should_send_endpoint_status_messages_to_clients_when_transferring_from_new_consultation_room()
        {
            _eventHandler = new EndpointTransferEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object, LoggerMock.Object);
            
            var conference = TestConference;
            var participantCount = conference.Participants.Count + 1; // plus one for admin
            var participantForEvent = conference.Endpoints.First();
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.EndpointTransfer,
                EventId = Guid.NewGuid().ToString(),
                ParticipantId = participantForEvent.Id,
                TransferFrom = "JudgeConsultationRoom3",
                TransferTo = "WaitingRoom",
                ConferenceId = conference.Id,
                Reason = "JVC Connection",
                TimeStampUtc = DateTime.UtcNow
            };

            foreach (var participant in conference.Participants)
            {
                conference.AddParticipantToConsultationRoom(callbackEvent.TransferFrom, participant);
            }

            foreach (var endpoint in conference.Endpoints)
            {
                conference.AddEndpointToConsultationRoom(callbackEvent.TransferFrom, endpoint);
            }
            
            await _eventHandler.HandleAsync(callbackEvent);
            EventHubClientMock.Verify(x => x.EndpointStatusMessage(participantForEvent.Id, conference.Id, EndpointState.Connected),
                Times.Exactly(participantCount));
            
            // Verify the conference cache has been updated
            conference.ConsultationRooms.Count.Should().Be(1);
            participantForEvent.CurrentRoom.Should().BeNull();
        }

        [Test]
        public async Task Should_send_endpoint_status_messages_to_clients_when_transferring_all_participants_out()
        {
            _eventHandler = new EndpointTransferEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object, LoggerMock.Object);
            
            var conference = TestConference;
            var participantCount = conference.Participants.Count + 1; // plus one for admin
            var participantForEvent = conference.Endpoints.First();
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.EndpointTransfer,
                EventId = Guid.NewGuid().ToString(),
                ParticipantId = participantForEvent.Id,
                TransferFrom = "JudgeConsultationRoom3",
                TransferTo = "WaitingRoom",
                ConferenceId = conference.Id,
                Reason = "JVC Connection",
                TimeStampUtc = DateTime.UtcNow
            };

            // The only participant or endpoint left in the consultation room
            conference.AddEndpointToConsultationRoom(callbackEvent.TransferFrom, participantForEvent);
            
            await _eventHandler.HandleAsync(callbackEvent);
            EventHubClientMock.Verify(x => x.EndpointStatusMessage(participantForEvent.Id, conference.Id, EndpointState.Connected),
                Times.Exactly(participantCount));
            
            // Verify the conference cache has been updated
            conference.ConsultationRooms.Count.Should().Be(0);
            participantForEvent.CurrentRoom.Should().BeNull();
        }

        [Test]
        public void Should_throw_exception_when_transfer_cannot_be_mapped_to_endpoint_status_cannot_be_derived()
        {
            _eventHandler = new EndpointTransferEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object, LoggerMock.Object);
            
            var conference = TestConference;
            var participantForEvent = conference.Endpoints[0];
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
                .Be($"Unable to derive state, no {nameof(callbackEvent.TransferTo)} provided (Parameter '{nameof(callbackEvent.TransferTo)}')");
            EventHubClientMock.Verify(x => x.EndpointStatusMessage(participantForEvent.Id, conference.Id, It.IsAny<EndpointState>()),
                Times.Never);
        }
    }
}
