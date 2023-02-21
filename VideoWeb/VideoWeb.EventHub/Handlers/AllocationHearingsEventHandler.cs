using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using VideoApi.Client;
using VideoWeb.Common.Caching;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.EventHub.Handlers
{
    public class AllocationHearingsEventHandler : EventHandlerBase
    {
        public AllocationHearingsEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext,
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
            return PublishAllocationHearingsMessage(callbackEvent.CsoAllocatedUserName, callbackEvent.AllocatedHearingsIds);
        }
    }
}
