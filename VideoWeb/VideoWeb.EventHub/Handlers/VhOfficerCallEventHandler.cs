using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Caching;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoWeb.Services.Video;
using EventType = VideoWeb.EventHub.Enums.EventType;
using RoomType = VideoWeb.Common.Models.RoomType;

namespace VideoWeb.EventHub.Handlers
{
    public class VhOfficerCallEventHandler : EventHandlerBase
    {
        public VhOfficerCallEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext,
            IConferenceCache conferenceCache, ILogger<EventHandlerBase> logger, IVideoApiClient videoApiClient) : base(
            hubContext, conferenceCache, logger, videoApiClient)
        {
        }

        public override EventType EventType => EventType.VhoCall;

        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            var targetRoom = ValidationConsultationRoom(callbackEvent);
            return HubContext.Clients.Group(SourceParticipant.Username.ToLowerInvariant())
                .ConsultationRequestResponseMessage(SourceConference.Id, targetRoom,
                    SourceParticipant.Id, Common.Models.ConsultationAnswer.None);
        }

        private string ValidationConsultationRoom(CallbackEvent callbackEvent)
        {
            if (string.IsNullOrWhiteSpace(callbackEvent.TransferTo) || !callbackEvent.TransferTo.Contains("consultation"))
            {
                throw new ArgumentException("No consultation room provided");
            }

            return callbackEvent.TransferTo;
        }
    }
}
