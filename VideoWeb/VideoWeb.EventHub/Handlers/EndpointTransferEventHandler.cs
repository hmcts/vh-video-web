using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Caching;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoApi.Client;
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

        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            var endpointStatus = DeriveEndpointStatusForTransferEvent(callbackEvent);
            return PublishEndpointStatusMessage(endpointStatus);
        }

        private static EndpointState DeriveEndpointStatusForTransferEvent(CallbackEvent callbackEvent)
        {
            if (string.IsNullOrWhiteSpace(callbackEvent.TransferTo))
            {
                throw new ArgumentException("No consultation room provided");   
            }
            var transferTo = Enum.Parse<VHRoom>(callbackEvent.TransferTo);
            var transferFrom = Enum.Parse<VHRoom>(callbackEvent.TransferFrom);
            var toConsultationRoom = transferTo == VHRoom.ConsultationRoom1 ||
                                     transferTo == VHRoom.ConsultationRoom2;

            if (transferFrom == VHRoom.WaitingRoom && toConsultationRoom)
                return EndpointState.InConsultation;

            var fromConsultationRoom = transferFrom == VHRoom.ConsultationRoom1 ||
                                       transferFrom == VHRoom.ConsultationRoom2;
            if (fromConsultationRoom && transferTo == VHRoom.WaitingRoom)
                return EndpointState.Connected;

            if ((transferFrom == VHRoom.ConsultationRoom1 ||
                 transferFrom == VHRoom.ConsultationRoom2) &&
                transferTo == VHRoom.HearingRoom)
                return EndpointState.Connected;

            switch (transferFrom)
            {
                case VHRoom.WaitingRoom when transferTo == VHRoom.HearingRoom:
                    return EndpointState.Connected;
                case VHRoom.HearingRoom when transferTo == VHRoom.WaitingRoom:
                    return EndpointState.Connected;
                default:
                    throw new RoomTransferException(callbackEvent.TransferFrom, callbackEvent.TransferTo);
            }
        }
    }
}
