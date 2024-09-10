using System.Collections.Generic;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.EventHub.Handlers
{
    public class AllocationHearingsEventHandler : EventHandlerBase
    {
        public override EventType EventType => EventType.AllocationHearings;

        public AllocationHearingsEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext,
            IConferenceService conferenceService,
            ILogger<AllocationHearingsEventHandler> logger) 
            : base(hubContext, conferenceService, logger)
        {
        }
        
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
