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
using EndpointState = VideoWeb.EventHub.Enums.EndpointState;
using VHRoom = VideoWeb.Common.Models.RoomType;

namespace VideoWeb.EventHub.Handlers
{
    public class EndpointTransferEventHandler : EventHandlerBase
    {
        public EndpointTransferEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext,
            IConferenceCache conferenceCache, ILogger<EventHandlerBase> logger, IVideoApiClient videoApiClient) : base(
            hubContext, conferenceCache, logger, videoApiClient)
        {
        }

        public override EventType EventType => EventType.EndpointTransfer;

        protected override async Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            var endpointStatus = DeriveEndpointStatusForTransferEvent(callbackEvent);
            await PublishEndpointStatusMessage(endpointStatus).ConfigureAwait(false);
        }

        private static EndpointState DeriveEndpointStatusForTransferEvent(CallbackEvent callbackEvent)
        {
            var toConsultationRoom = callbackEvent.TransferTo == VHRoom.ConsultationRoom1 ||
                                     callbackEvent.TransferTo == VHRoom.ConsultationRoom2;

            if (callbackEvent.TransferFrom == VHRoom.WaitingRoom && toConsultationRoom)
                return EndpointState.InConsultation;

            var fromConsultationRoom = callbackEvent.TransferFrom == VHRoom.ConsultationRoom1 ||
                                       callbackEvent.TransferFrom == VHRoom.ConsultationRoom2;
            if (fromConsultationRoom && callbackEvent.TransferTo == VHRoom.WaitingRoom)
                return EndpointState.Connected;

            if ((callbackEvent.TransferFrom == VHRoom.ConsultationRoom1 ||
                 callbackEvent.TransferFrom == VHRoom.ConsultationRoom2) &&
                callbackEvent.TransferTo == VHRoom.HearingRoom)
                return EndpointState.Connected;

            switch (callbackEvent.TransferFrom)
            {
                case VHRoom.WaitingRoom when callbackEvent.TransferTo == VHRoom.HearingRoom:
                    return EndpointState.Connected;
                case VHRoom.HearingRoom when callbackEvent.TransferTo == VHRoom.WaitingRoom:
                    return EndpointState.Connected;
                default:
                    throw new RoomTransferException(callbackEvent.TransferFrom.GetValueOrDefault(),
                        callbackEvent.TransferTo.GetValueOrDefault());
            }
        }
    }
}
