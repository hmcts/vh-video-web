using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.Common;
using VideoWeb.EventHub.Services;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.EventHub.Handlers
{
    public class VhOfficerCallEventHandler(
        IHubContext<Hub.EventHub, IEventHubClient> hubContext,
        ILogger<EventHandlerBase> logger,
        IVideoApiClient videoApiClient,
        IConsultationNotifier consultationNotifier,
        IConferenceService conferenceService)
        : EventHandlerBase(hubContext, conferenceService, logger)
    {
        public override EventType EventType => EventType.VhoCall;

        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            var targetRoom = ValidationConsultationRoom(callbackEvent);
            if (SourceEndpointDto != null)
            {
                return videoApiClient.JoinEndpointToConsultationAsync(new EndpointConsultationRequest
                {
                    ConferenceId = SourceConferenceDto.Id,
                    EndpointId = SourceEndpointDto.Id,
                    RoomLabel = targetRoom
                });
            }

            return consultationNotifier.NotifyConsultationRequestAsync(SourceConferenceDto, targetRoom, Guid.Empty, SourceParticipantDto.Id);
        }

        private string ValidationConsultationRoom(CallbackEvent callbackEvent)
        {
            if (string.IsNullOrWhiteSpace(callbackEvent.TransferTo) || !callbackEvent.TransferTo.ToLower().Contains("consultation"))
            {
                throw new ArgumentException("No consultation room provided");
            }

            return callbackEvent.TransferTo;
        }
    }
}
