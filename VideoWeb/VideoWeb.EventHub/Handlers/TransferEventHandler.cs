using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
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

        protected override async Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            var participantStatus = DeriveParticipantStatusForTransferEvent(callbackEvent);
            await PublishParticipantStatusMessage(participantStatus).ConfigureAwait(false);
        }

        private static ParticipantState DeriveParticipantStatusForTransferEvent(CallbackEvent callbackEvent)
        {
            if (callbackEvent.TransferFrom == RoomType.WaitingRoom &&
                (callbackEvent.TransferTo == RoomType.ConsultationRoom1 ||
                 callbackEvent.TransferTo == RoomType.ConsultationRoom2))
                return ParticipantState.InConsultation;

            if ((callbackEvent.TransferFrom == RoomType.ConsultationRoom1 ||
                 callbackEvent.TransferFrom == RoomType.ConsultationRoom2) &&
                callbackEvent.TransferTo == RoomType.WaitingRoom)
                return ParticipantState.Available;

            if ((callbackEvent.TransferFrom == RoomType.ConsultationRoom1 ||
                 callbackEvent.TransferFrom == RoomType.ConsultationRoom2) &&
                callbackEvent.TransferTo == RoomType.HearingRoom)
                return ParticipantState.InHearing;

            switch (callbackEvent.TransferFrom)
            {
                case RoomType.WaitingRoom when callbackEvent.TransferTo == RoomType.HearingRoom:
                    return ParticipantState.InHearing;
                case RoomType.HearingRoom when callbackEvent.TransferTo == RoomType.WaitingRoom:
                    return ParticipantState.Available;
                default:
                    throw new RoomTransferException(callbackEvent.TransferFrom.GetValueOrDefault(),
                        callbackEvent.TransferTo.GetValueOrDefault());
            }
        }
    }
}
