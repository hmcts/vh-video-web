using System.Collections.Generic;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Caching;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.EventHub.Handlers
{
    public class AllocationHearingsEventHandler : EventHandlerBase
    {
        public AllocationHearingsEventHandler(IHubContext<Hub.EventHubPPS2, IEventHubClient> hubContext,
            IConferenceCache conferenceCache, ILogger<EventHandlerBase> logger, IVideoApiClient videoApiClient) : base(
            hubContext, conferenceCache, logger, videoApiClient)
        {
        }

        public override EventType EventType => EventType.AllocationHearings;

        public override async Task HandleAsync(CallbackEvent callbackEvent)
        {
            await PublishStatusAsync(callbackEvent);
        }

        protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            return PublishAllocationHearingsMessage(callbackEvent.CsoAllocatedUserName, callbackEvent.AllocatedHearingsDetails);
        }
        
        private async Task PublishAllocationHearingsMessage(string csoUserName, List<HearingDetailRequest> hearings)
        {
            await HubContext.Clients.Group(csoUserName.ToLowerInvariant())
                .AllocationHearings(csoUserName, hearings);
        }
    }
}
