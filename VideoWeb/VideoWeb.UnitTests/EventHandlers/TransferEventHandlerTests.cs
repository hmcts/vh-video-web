using System;
using System.Linq;
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
    public class TransferEventHandlerTests : EventHandlerTestBase
    {
        private TransferEventHandler _eventHandler;

        [TestCase(RoomType.WaitingRoom, RoomType.HearingRoom, ParticipantState.InHearing, ParticipantStatus.InHearing)]
        [TestCase(RoomType.HearingRoom, RoomType.WaitingRoom, ParticipantState.Available, ParticipantStatus.Available)]
        public async Task Should_send_participant__status_messages_to_clients_and_asb_when_transfer_occurs(
            RoomType from, RoomType to, ParticipantState status,  ParticipantStatus expectedStatus)
        {
            _eventHandler = new TransferEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object, LoggerMock.Object);

            var conference = TestConference;
            var participantForEvent = conference.Participants.First(x => x.Role == Role.Individual);
            var participantCount = conference.Participants.Count + 1; // plus one for admin

            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Transfer,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                ParticipantId = participantForEvent.Id,
                TransferFrom = from.ToString(),
                TransferTo = to.ToString(),
                TimeStampUtc = DateTime.UtcNow
            };
            await _eventHandler.HandleAsync(callbackEvent);

            // Verify messages sent to event hub clients
            EventHubClientMock.Verify(
                x => x.ParticipantStatusMessage(_eventHandler.SourceParticipant.Id, _eventHandler.SourceParticipant.Username, conference.Id,
                    status), Times.Exactly(participantCount));
            TestConference.Participants.Find(x => x.Id == participantForEvent.Id).ParticipantStatus.Should().Be(expectedStatus);
            
        }

        [Test]
        public async Task should_send_participant_status_when_transferring_to_new_consultation_room()
        {
            _eventHandler = new TransferEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object, LoggerMock.Object);

            var conference = TestConference;
            var participantForEvent = conference.Participants.First(x => x.Role == Role.Individual);
            var participantCount = conference.Participants.Count + 1; // plus one for admin

            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Transfer,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                ParticipantId = participantForEvent.Id,
                TransferFrom = RoomType.WaitingRoom.ToString(),
                TransferTo = "JudgeConsultationRoom3",
                TimeStampUtc = DateTime.UtcNow
            };

            var expectedStatus = ParticipantState.InConsultation;

            await _eventHandler.HandleAsync(callbackEvent);

            // Verify messages sent to event hub clients
            EventHubClientMock.Verify(
                x => x.ParticipantStatusMessage(_eventHandler.SourceParticipant.Id, _eventHandler.SourceParticipant.Username, conference.Id,
                    expectedStatus), Times.Exactly(participantCount));

            // Verify the conference cache has been updated
            TestConference.Participants.Find(x => x.Id == participantForEvent.Id).ParticipantStatus.Should()
                .Be(ParticipantStatus.InConsultation);
            conference.ConsultationRooms.Count.Should().Be(1);
            var consultationRoom = conference.ConsultationRooms[0];
            consultationRoom.Label.Should().Be(callbackEvent.TransferTo);
            consultationRoom.Locked.Should().Be(true);
            participantForEvent.CurrentRoom.Should().Be(consultationRoom);
        }
        
        [Test]
        public async Task should_send_participant_status_when_transferring_to_existing_consultation_room()
        {
            // ie we are transferring a participant into a room with participants already in it
            
            _eventHandler = new TransferEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object, LoggerMock.Object);

            var conference = TestConference;
            var participantForEvent = conference.Participants.First(x => x.Role == Role.Individual);
            var participantCount = conference.Participants.Count + 1; // plus one for admin

            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Transfer,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                ParticipantId = participantForEvent.Id,
                TransferFrom = RoomType.WaitingRoom.ToString(),
                TransferTo = "JudgeConsultationRoom3",
                TimeStampUtc = DateTime.UtcNow
            };

            var expectedStatus = ParticipantState.InConsultation;

            foreach (var participant in conference.Participants)
            {
                if (participant.Id == participantForEvent.Id) continue;
                
                conference.AddParticipantToConsultationRoom(callbackEvent.TransferTo, participant);
            }
            
            await _eventHandler.HandleAsync(callbackEvent);

            // Verify messages sent to event hub clients
            EventHubClientMock.Verify(
                x => x.ParticipantStatusMessage(_eventHandler.SourceParticipant.Id, _eventHandler.SourceParticipant.Username, conference.Id,
                    expectedStatus), Times.Exactly(participantCount));

            // Verify the conference cache has been updated
            TestConference.Participants.Find(x => x.Id == participantForEvent.Id).ParticipantStatus.Should()
                .Be(ParticipantStatus.InConsultation);
            conference.ConsultationRooms.Count.Should().Be(1);
            var consultationRoom = conference.ConsultationRooms[0];
            consultationRoom.Label.Should().Be(callbackEvent.TransferTo);
            consultationRoom.Locked.Should().Be(true);
            participantForEvent.CurrentRoom.Should().Be(consultationRoom);
        }

        [Test]
        public async Task should_send_participant_status_when_transferring_from_new_consultation_room()
        {
            _eventHandler = new TransferEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object, LoggerMock.Object);

            var conference = TestConference;
            var participantForEvent = conference.Participants.First(x => x.Role == Role.Individual);
            var participantCount = conference.Participants.Count + 1; // plus one for admin

            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Transfer,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                ParticipantId = participantForEvent.Id,
                TransferFrom = "JudgeConsultationRoom3",
                TransferTo = RoomType.WaitingRoom.ToString(),
                TimeStampUtc = DateTime.UtcNow
            };

            var expectedStatus = ParticipantState.Available;

            foreach (var participant in conference.Participants)
            {
                conference.AddParticipantToConsultationRoom(callbackEvent.TransferFrom, participant);
            }

            await _eventHandler.HandleAsync(callbackEvent);

            // Verify messages sent to event hub clients
            EventHubClientMock.Verify(
                x => x.ParticipantStatusMessage(_eventHandler.SourceParticipant.Id, _eventHandler.SourceParticipant.Username, conference.Id,
                    expectedStatus), Times.Exactly(participantCount));
            
            // Verify the conference cache has been updated
            TestConference.Participants.Find(x => x.Id == participantForEvent.Id).ParticipantStatus.Should()
                .Be(ParticipantStatus.Available);
            conference.ConsultationRooms.Count.Should().Be(1);
            participantForEvent.CurrentRoom.Should().BeNull();
        }

        [Test]
        public async Task should_remove_consultation_room_when_transferring_all_participants_out()
        {
            _eventHandler = new TransferEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object, LoggerMock.Object);

            var conference = TestConference;
            var participantForEvent = conference.Participants.First(x => x.Role == Role.Individual);
            var participantCount = conference.Participants.Count + 1; // plus one for admin

            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Transfer,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                ParticipantId = participantForEvent.Id,
                TransferFrom = "JudgeConsultationRoom3",
                TransferTo = RoomType.WaitingRoom.ToString(),
                TimeStampUtc = DateTime.UtcNow
            };

            var expectedStatus = ParticipantState.Available;
            
            // The only participant left in the consultation room
            conference.AddParticipantToConsultationRoom(callbackEvent.TransferFrom, participantForEvent);
            
            await _eventHandler.HandleAsync(callbackEvent);

            // Verify messages sent to event hub clients
            EventHubClientMock.Verify(
                x => x.ParticipantStatusMessage(_eventHandler.SourceParticipant.Id, _eventHandler.SourceParticipant.Username, conference.Id,
                    expectedStatus), Times.Exactly(participantCount));
            
            // Verify the conference cache has been updated
            TestConference.Participants.Find(x => x.Id == participantForEvent.Id).ParticipantStatus.Should()
                .Be(ParticipantStatus.Available);
            conference.ConsultationRooms.Count.Should().Be(0);
            participantForEvent.CurrentRoom.Should().BeNull();
        }

        [Test]
        public async Task should_send_participant_status_when_transferring_a_linked_participant()
        {
            _eventHandler = new TransferEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object, LoggerMock.Object);

            var conference = TestConference;
            var participantForEvent = conference.Participants.First(x => x.LinkedParticipants.Count != 0 && x.Role == Role.Individual);
            var participantCount = conference.Participants.Count + 1; // plus one for admin

            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Transfer,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                ParticipantId = participantForEvent.Id,
                TransferFrom = RoomType.WaitingRoom.ToString(),
                TransferTo = "ParticipantConsultationRoom3",
                TimeStampUtc = DateTime.UtcNow
            };

            var expectedStatus = ParticipantState.InConsultation;

            await _eventHandler.HandleAsync(callbackEvent);

            // Verify messages sent to event hub clients
            EventHubClientMock.Verify(
                x => x.ParticipantStatusMessage(_eventHandler.SourceParticipant.Id, _eventHandler.SourceParticipant.Username, conference.Id,
                    expectedStatus), Times.Exactly(participantCount));
            
            // Verify the conference cache has been updated
            TestConference.Participants.Find(x => x.Id == participantForEvent.Id).ParticipantStatus.Should()
                .Be(ParticipantStatus.InConsultation);
        }
    }
}
