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
using VideoWeb.Common;
using EventType = VideoWeb.EventHub.Enums.EventType;
using EndpointState = VideoWeb.EventHub.Enums.EndpointState;
using VHRoom = VideoWeb.Common.Models.RoomType;

namespace VideoWeb.EventHub.Handlers
{
    public class EndpointTransferEventHandler (
        IHubContext<Hub.EventHub, IEventHubClient> hubContext,
        IConferenceService conferenceService,
        ILogger<EventHandlerBase> logger)
        : EventHandlerBase(hubContext, conferenceService, logger)
    {

        public override EventType EventType => EventType.EndpointTransfer;

        protected override async Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            var endpointStatus = DeriveEndpointStatusForTransferEvent(callbackEvent);
            await PublishRoomTransferMessage(new RoomTransfer { ParticipantId = callbackEvent.ParticipantId, FromRoom = callbackEvent.TransferFrom, ToRoom = callbackEvent.TransferTo });
            await PublishEndpointStatusMessage(endpointStatus);
        }

        private static EndpointState DeriveEndpointStatusForTransferEvent(CallbackEvent callbackEvent)
        {
            if (string.IsNullOrWhiteSpace(callbackEvent.TransferTo))
            {
                throw new ArgumentException($"Unable to derive state, no {nameof(callbackEvent.TransferTo)} provided", nameof(callbackEvent.TransferTo));
            }

            var isRoomToEnum = Enum.TryParse<VHRoom>(callbackEvent.TransferTo, out var transferTo);
            if (!isRoomToEnum && callbackEvent.TransferTo.ToLower().Contains("consultation"))
            {
                return EndpointState.InConsultation;
            }

            if (transferTo == VHRoom.WaitingRoom || transferTo == VHRoom.HearingRoom)
            {
                return EndpointState.Connected;
            }

            if (transferTo == VHRoom.ConsultationRoom)
            {
                return EndpointState.InConsultation;
            }

            throw new RoomTransferException(callbackEvent.TransferFrom, callbackEvent.TransferTo);
        }
    }
}
