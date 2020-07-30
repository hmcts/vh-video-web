using System;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Models;

namespace VideoWeb.UnitTests.EventHandlers
{
    public class TransferEventHandlerTests : EventHandlerTestBase
    {
        private TransferEventHandler _eventHandler;

        [TestCase(RoomType.WaitingRoom, RoomType.HearingRoom, ParticipantState.InHearing)]
        [TestCase(RoomType.HearingRoom, RoomType.WaitingRoom, ParticipantState.Available)]
        [TestCase(RoomType.WaitingRoom, RoomType.ConsultationRoom1, ParticipantState.InConsultation)]
        [TestCase(RoomType.WaitingRoom, RoomType.ConsultationRoom2, ParticipantState.InConsultation)]
        [TestCase(RoomType.ConsultationRoom1, RoomType.WaitingRoom, ParticipantState.Available)]
        [TestCase(RoomType.ConsultationRoom2, RoomType.WaitingRoom, ParticipantState.Available)]
        [TestCase(RoomType.ConsultationRoom1, RoomType.HearingRoom, ParticipantState.InHearing)]
        [TestCase(RoomType.ConsultationRoom2, RoomType.HearingRoom, ParticipantState.InHearing)]
        public async Task Should_send_participant__status_messages_to_clients_and_asb_when_transfer_occurs(
            RoomType from, RoomType to, ParticipantState status)
        {
            _eventHandler = new TransferEventHandler(EventHubContextMock.Object, ConferenceCache, LoggerMock.Object,
                VideoApiClientMock.Object);

            var conference = TestConference;
            var participantForEvent = conference.Participants.First(x => x.Role == Role.Individual);
            var participantCount = conference.Participants.Count + 1; // plus one for admin

            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Transfer,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                ParticipantId = participantForEvent.Id,
                TransferFrom = from,
                TransferTo = to,
                TimeStampUtc = DateTime.UtcNow
            };
            await _eventHandler.HandleAsync(callbackEvent);

            // Verify messages sent to event hub clients
            EventHubClientMock.Verify(
                x => x.ParticipantStatusMessage(_eventHandler.SourceParticipant.Id, _eventHandler.SourceParticipant.Username, conference.Id,
                    status), Times.Exactly(participantCount));
        }

        [Test]
        public void Should_throw_exception_when_transfer_cannot_be_mapped_to_participant_status()
        {
            _eventHandler = new TransferEventHandler(EventHubContextMock.Object, ConferenceCache, LoggerMock.Object,
                VideoApiClientMock.Object);

            var conference = TestConference;
            var participantForEvent = conference.Participants.First(x => x.Role == Role.Individual);

            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Transfer,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                ParticipantId = participantForEvent.Id,
                TransferFrom = RoomType.WaitingRoom,
                TransferTo = RoomType.WaitingRoom,
                TimeStampUtc = DateTime.UtcNow
            };

            Assert.ThrowsAsync<RoomTransferException>(() =>
                _eventHandler.HandleAsync(callbackEvent));

            // Verify messages sent to event hub clients
            EventHubClientMock.Verify(
                x => x.ParticipantStatusMessage(_eventHandler.SourceParticipant.Id, _eventHandler.SourceParticipant.Username, conference.Id,
                    It.IsAny<ParticipantState>()), Times.Never);
        }
        
        [Test]
        public async Task
            Should_send_in_hearing_message_to_participants_and_live_message_to_service_bus_when_judge_transfers_to_hearing_room()
        {
            _eventHandler = new TransferEventHandler(EventHubContextMock.Object, ConferenceCache, LoggerMock.Object,
                VideoApiClientMock.Object);

            var conference = TestConference;
            var participantForEvent = conference.Participants.First(x => x.Role == Role.Judge);
            var participantCount = conference.Participants.Count + 1; // plus one for admin

            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Transfer,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                TransferFrom = RoomType.WaitingRoom,
                TransferTo = RoomType.HearingRoom,
                ParticipantId = participantForEvent.Id,
                TimeStampUtc = DateTime.UtcNow
            };

            await _eventHandler.HandleAsync(callbackEvent);


            // Verify event hub client
            EventHubClientMock.Verify(
                x => x.ParticipantStatusMessage(_eventHandler.SourceParticipant.Id, _eventHandler.SourceParticipant.Username, conference.Id,
                    ParticipantState.InHearing), Times.Exactly(participantCount));

            EventHubClientMock.Verify(
                x => x.ConferenceStatusMessage(conference.Id, ConferenceStatus.InSession),
                Times.Exactly(participantCount));
        }
        
        [Test]
        public async Task
            Should_not_send_in_hearing_message_to_participants_and_live_message_to_service_bus_when_judge_transfers_to_waiting_room()
        {
            _eventHandler = new TransferEventHandler(EventHubContextMock.Object, ConferenceCache, LoggerMock.Object,
                VideoApiClientMock.Object);

            var conference = TestConference;
            var participantForEvent = conference.Participants.First(x => x.Role == Role.Judge);
            var participantCount = conference.Participants.Count + 1; // plus one for admin

            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Transfer,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                TransferFrom = RoomType.ConsultationRoom1,
                TransferTo = RoomType.WaitingRoom,
                ParticipantId = participantForEvent.Id,
                TimeStampUtc = DateTime.UtcNow
            };

            await _eventHandler.HandleAsync(callbackEvent);


            // Verify event hub client
            EventHubClientMock.Verify(
                x => x.ParticipantStatusMessage(_eventHandler.SourceParticipant.Id, _eventHandler.SourceParticipant.Username, conference.Id,
                    ParticipantState.Available), Times.Exactly(participantCount));

            EventHubClientMock.Verify(
                x => x.ConferenceStatusMessage(conference.Id, ConferenceStatus.InSession),
                Times.Never);
        }
    }
}
