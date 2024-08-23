using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoApi.Client;
using VideoApi.Contract.Requests;
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
            if (SourceEndpoint != null)
            {
                return videoApiClient.JoinEndpointToConsultationAsync(new EndpointConsultationRequest
                {
                    ConferenceId = SourceConference.Id,
                    EndpointId = SourceEndpoint.Id,
                    RoomLabel = targetRoom
                });
            }

            return consultationNotifier.NotifyConsultationRequestAsync(SourceConference, targetRoom, Guid.Empty, SourceParticipant.Id);
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
