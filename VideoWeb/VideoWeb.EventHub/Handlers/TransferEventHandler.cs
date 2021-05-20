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
using ParticipantState = VideoWeb.EventHub.Enums.ParticipantState;
using RoomType = VideoWeb.Common.Models.RoomType;

namespace VideoWeb.EventHub.Handlers
{
    public class TransferEventHandler : EventHandlerBase
    {
        private readonly ILogger<EventHandlerBase> _logger;

        public TransferEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext,
            IConferenceCache conferenceCache, ILogger<EventHandlerBase> logger, IVideoApiClient videoApiClient) : base(
            hubContext, conferenceCache, logger, videoApiClient)
        {
            _logger = logger;
        }

        public override EventType EventType => EventType.Transfer;

        protected override async Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            var participantStatus = DeriveParticipantStatusForTransferEvent(callbackEvent, _logger);
            await PublishParticipantStatusMessage(participantStatus);

            var roomTransferMessage = new RoomTransfer
            {
                ParticipantId = callbackEvent.ParticipantId, FromRoom = callbackEvent.TransferFrom,
                ToRoom = callbackEvent.TransferTo
            };
            
            _logger.LogTrace("Video Web - Transfer Event Handler - Received event - {Status} / {@Message} - {Tags}", participantStatus, roomTransferMessage, "VIH-7730");
            await PublishRoomTransferMessage(roomTransferMessage);
        }

        private static ParticipantState DeriveParticipantStatusForTransferEvent(CallbackEvent callbackEvent, ILogger<EventHandlerBase> logger)
        {
            var isRoomToEnum = Enum.TryParse<RoomType>(callbackEvent.TransferTo, out var transferTo);
            if (!isRoomToEnum && callbackEvent.TransferTo.ToLower().Contains("consultation"))
            {
                return ParticipantState.InConsultation;
            }

            if (transferTo == RoomType.WaitingRoom)
            {
                return ParticipantState.Available;
            }

            if (transferTo == RoomType.HearingRoom)
            {
                return ParticipantState.InHearing;
            }

            if (transferTo == RoomType.ConsultationRoom)
            {
                return ParticipantState.InConsultation;
            }
            
            logger.LogError("Video Web - DeriveParticipantStatusForTransferEvent - Couldn't derrive correct state - throwing - {IsToRoom} / {@Event} - {Tags}", isRoomToEnum, callbackEvent, "VIH-7730");
            throw new RoomTransferException(callbackEvent.TransferFrom, callbackEvent.TransferTo);
        }
    }
}
