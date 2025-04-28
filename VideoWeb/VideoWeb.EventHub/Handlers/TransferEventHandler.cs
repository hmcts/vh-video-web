using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Exceptions;
using EventType = VideoWeb.EventHub.Enums.EventType;
using ParticipantState = VideoWeb.EventHub.Enums.ParticipantState;
using RoomType = VideoWeb.Common.Models.RoomType;

namespace VideoWeb.EventHub.Handlers
{
    public class TransferEventHandler(
        IHubContext<Hub.EventHub, IEventHubClient> hubContext,
        IConferenceService conferenceService,
        ILogger<EventHandlerBase> logger)
        : EventHandlerBase(hubContext, conferenceService, logger)
    {
        public override EventType EventType => EventType.Transfer;

        protected override async Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            var participantStatusTuple = DeriveParticipantStatusForTransferEvent(callbackEvent);
            await PublishRoomTransferMessage(new RoomTransfer
            {
                ParticipantId = callbackEvent.ParticipantId, FromRoom = callbackEvent.TransferFrom,
                ToRoom = callbackEvent.TransferTo
            });
            await PublishParticipantStatusMessage(participantStatusTuple.state, participantStatusTuple.status,
                callbackEvent.Reason, callbackEvent);
        }

        private static (ParticipantState state, ParticipantStatus status) DeriveParticipantStatusForTransferEvent(CallbackEvent callbackEvent)
        {
            var isRoomToEnum = Enum.TryParse<RoomType>(callbackEvent.TransferTo, out var transferTo);
            if (!isRoomToEnum && callbackEvent.TransferTo.ToLower().Contains("consultation"))
            {
                return (ParticipantState.InConsultation, ParticipantStatus.InConsultation);
            }

            if (transferTo == RoomType.WaitingRoom)
            {
                return (ParticipantState.Available, ParticipantStatus.Available);
            }

            if (transferTo == RoomType.HearingRoom)
            {
                return (ParticipantState.InHearing, ParticipantStatus.InHearing);
            }

            if (transferTo == RoomType.ConsultationRoom)
            {
                return (ParticipantState.InConsultation, ParticipantStatus.InConsultation);
            }

            throw new RoomTransferException(callbackEvent.TransferFrom, callbackEvent.TransferTo);
        }
    }
}
