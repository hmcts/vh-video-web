using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.Common.Models;
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
            await PublishEndpointStatusMessage(endpointStatus.state, endpointStatus.newStatus, callbackEvent);
        }

        private static (EndpointState state, EndpointStatus newStatus) DeriveEndpointStatusForTransferEvent(CallbackEvent callbackEvent)
        {
            if (string.IsNullOrWhiteSpace(callbackEvent.TransferTo))
            {
                throw new ArgumentException($"Unable to derive state, no {nameof(callbackEvent.TransferTo)} provided", nameof(callbackEvent));
            }

            var isRoomToEnum = Enum.TryParse<VHRoom>(callbackEvent.TransferTo, out var transferTo);
            if (!isRoomToEnum && callbackEvent.TransferTo.Contains("consultation", StringComparison.CurrentCultureIgnoreCase))
            {
                return (EndpointState.InConsultation, EndpointStatus.InConsultation);
            }

            switch (transferTo)
            {
                case VHRoom.WaitingRoom:
                    return (EndpointState.Connected, EndpointStatus.Connected);
                case VHRoom.HearingRoom:
                    return (EndpointState.InHearing, EndpointStatus.InHearing);
                case VHRoom.ConsultationRoom:
                    return (EndpointState.InConsultation, EndpointStatus.InConsultation);
                default:
                    throw new RoomTransferException(callbackEvent.TransferFrom, callbackEvent.TransferTo);
            }
        }
    }
}
