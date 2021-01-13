using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Caching;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoWeb.Services.Video;
using EventType = VideoWeb.EventHub.Enums.EventType;
using ParticipantState = VideoWeb.EventHub.Enums.ParticipantState;
using RoomType = VideoWeb.Common.Models.RoomType;

namespace VideoWeb.EventHub.Handlers
{
    public class TransferEventHandler : EventHandlerBase
    {
        public TransferEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext,
            IConferenceCache conferenceCache, ILogger<EventHandlerBase> logger, IVideoApiClient videoApiClient) : base(
            hubContext, conferenceCache, logger, videoApiClient)
        {
        }

        public override EventType EventType => EventType.Transfer;

        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            var participantStatus = DeriveParticipantStatusForTransferEvent(callbackEvent);
            return PublishParticipantStatusMessage(participantStatus);
        }

        private static ParticipantState DeriveParticipantStatusForTransferEvent(CallbackEvent callbackEvent)
        {
            var isRoomToEnum = Enum.TryParse<RoomType>(callbackEvent.TransferTo, out var transferTo);
            Enum.TryParse<RoomType>(callbackEvent.TransferFrom, out var transferFrom);

            if (!isRoomToEnum && callbackEvent.TransferTo.ToLower().Contains("consultation"))
            {
                return ParticipantState.InConsultation;
            }

            if (transferFrom == RoomType.WaitingRoom &&
                (transferTo == RoomType.ConsultationRoom1 ||
                 transferTo == RoomType.ConsultationRoom2))
                return ParticipantState.InConsultation;

            if ((transferFrom == RoomType.ConsultationRoom1 ||
                 transferFrom == RoomType.ConsultationRoom2 ||
                 callbackEvent.TransferFrom.ToLower().Contains("consultation")) &&
                transferTo == RoomType.WaitingRoom)
                return ParticipantState.Available;

            if ((transferFrom == RoomType.ConsultationRoom1 ||
                 transferFrom == RoomType.ConsultationRoom2) &&
                transferTo == RoomType.HearingRoom)
                return ParticipantState.InHearing;

            switch (transferFrom)
            {
                case RoomType.WaitingRoom when transferTo == RoomType.HearingRoom:
                    return ParticipantState.InHearing;
                case RoomType.HearingRoom when transferTo == RoomType.WaitingRoom:
                    return ParticipantState.Available;
                default:
                    throw new RoomTransferException(callbackEvent.TransferFrom, callbackEvent.TransferTo);
            }
        }
    }
}
