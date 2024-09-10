using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.EventHub.Services;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.EventHub.Handlers
{
    public class VhOfficerCallEventHandler : EventHandlerBase
    {
        public override EventType EventType => EventType.VhoCall;

        private readonly IVideoApiClient _videoApiClient;
        private readonly IConsultationNotifier _consultationNotifier;
        
        public VhOfficerCallEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext,
            ILogger<EventHandlerBase> logger,
            IVideoApiClient videoApiClient,
            IConsultationNotifier consultationNotifier,
            IConferenceService conferenceService)
            : base(hubContext, conferenceService, logger)
        {
            _videoApiClient = videoApiClient;
            _consultationNotifier = consultationNotifier;
        }
        
        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            var targetRoom = ValidationConsultationRoom(callbackEvent);
            if (SourceEndpoint != null)
            {
                return _videoApiClient.JoinEndpointToConsultationAsync(new EndpointConsultationRequest
                {
                    ConferenceId = SourceConference.Id,
                    EndpointId = SourceEndpoint.Id,
                    RoomLabel = targetRoom
                });
            }

            return _consultationNotifier.NotifyConsultationRequestAsync(SourceConference, targetRoom, Guid.Empty, SourceParticipant.Id);
        }

        private static string ValidationConsultationRoom(CallbackEvent callbackEvent)
        {
            if (string.IsNullOrWhiteSpace(callbackEvent.TransferTo) || !callbackEvent.TransferTo.ToLower().Contains("consultation"))
            {
                throw new ArgumentException("No consultation room provided");
            }

            return callbackEvent.TransferTo;
        }
    }
}
