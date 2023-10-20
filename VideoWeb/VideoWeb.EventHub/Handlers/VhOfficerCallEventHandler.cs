using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Caching;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.EventHub.Services;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.EventHub.Handlers
{
    public class VhOfficerCallEventHandler : EventHandlerBase
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly IConsultationNotifier _consultationNotifier;

        public VhOfficerCallEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext,
            IConferenceCache conferenceCache, ILogger<EventHandlerBase> logger, IVideoApiClient videoApiClient, IConsultationNotifier consultationNotifier) : base(
            hubContext, conferenceCache, logger, videoApiClient)
        {
            _videoApiClient = videoApiClient;
            _consultationNotifier = consultationNotifier;
        }

        public override EventType EventType => EventType.VhoCall;

        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            var targetRoom = ValidationConsultationRoom(callbackEvent);
            if (SourceEndpoint != null)
            {
                return _videoApiClient.JoinEndpointToConsultationAsync(new EndpointConsultationRequest
                {
                    ConferenceId = SourceConference.Id,
                    RequestedById = Guid.Empty,
                    EndpointId = SourceEndpoint.Id,
                    RoomLabel = targetRoom
                });
            }

            return _consultationNotifier.NotifyConsultationRequestAsync(SourceConference, targetRoom, Guid.Empty,
                SourceParticipant.Id);
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
