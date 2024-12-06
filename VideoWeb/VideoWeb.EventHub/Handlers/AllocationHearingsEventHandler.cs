using System.Collections.Generic;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.EventHub.Handlers
{
    public class AllocationHearingsEventHandler(
        IHubContext<Hub.EventHubVIH11189, IEventHubClient> hubContext,
        IConferenceService conferenceService,
        ILogger<EventHandlerBase> logger)
        : EventHandlerBase(hubContext, conferenceService, logger)
    {

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
