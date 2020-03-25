using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Caching;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;

namespace VideoWeb.EventHub.Handlers
{
    public class VhOfficerCallEventHandler : EventHandlerBase
    {
        public VhOfficerCallEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext, IConferenceCache conferenceCache, ILogger<EventHandlerBase> logger) : base(hubContext, conferenceCache, logger)
        {
        }

        public override EventType EventType => EventType.VhoCall;

        protected override async Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            var targetRoom = ValidationConsultationRoom(callbackEvent);
            await HubContext.Clients.Group(SourceParticipant.Username.ToLowerInvariant())
                .AdminConsultationMessage(SourceConference.Id, targetRoom,
                    SourceParticipant.Username.ToLowerInvariant());
        }

        private RoomType ValidationConsultationRoom(CallbackEvent callbackEvent)
        {
            if (!callbackEvent.TransferTo.HasValue || callbackEvent.TransferTo.Value != RoomType.ConsultationRoom1 
                && callbackEvent.TransferTo.Value != RoomType.ConsultationRoom2) 
            {
                throw new ArgumentException("No consultation room provided");
            }

            return callbackEvent.TransferTo.Value;
        }
    }
}
