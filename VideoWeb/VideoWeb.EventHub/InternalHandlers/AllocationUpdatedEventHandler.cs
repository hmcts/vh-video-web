using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.InternalHandlers.Core;
using VideoWeb.EventHub.InternalHandlers.Models;
using VideoWeb.EventHub.Models;

namespace VideoWeb.EventHub.InternalHandlers
{
    public class AllocationUpdatedEventHandler : IInternalEventHandler<AllocationUpdatedEventDto>
    {
        private readonly IHubContext<VideoWeb.EventHub.Hub.EventHub, IEventHubClient> _hubContext;

        public AllocationUpdatedEventHandler(IHubContext<EventHub.Hub.EventHub, IEventHubClient> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task HandleAsync(AllocationUpdatedEventDto eventPayload)
        {
            var updatedAllocations = eventPayload.Conferences.Select(x => new UpdatedAllocationDto
            {
                ConferenceId = x.Id,
                CaseName = x.CaseName,
                JudgeDisplayName = x.GetJudge().DisplayName,
                ScheduledDateTime = x.ScheduledDateTime
            }).ToList();
            await _hubContext.Clients.Group(eventPayload.CsoUsername.ToLowerInvariant()).AllocationsUpdated(updatedAllocations);
        }

        public async Task HandleAsync(object eventPayload)
        {
            var payload = eventPayload as AllocationUpdatedEventDto;
            await HandleAsync(payload);
        }
    }
}
