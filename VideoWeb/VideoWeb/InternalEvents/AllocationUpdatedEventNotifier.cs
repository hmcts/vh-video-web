using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoWeb.InternalEvents.Interfaces;

namespace VideoWeb.InternalEvents
{
    public class AllocationUpdatedEventNotifier : IAllocationUpdatedEventNotifier
    {
        private readonly IHubContext<VideoWeb.EventHub.Hub.EventHub, IEventHubClient> _hubContext;

        public AllocationUpdatedEventNotifier(IHubContext<EventHub.Hub.EventHub, IEventHubClient> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task PushAllocationUpdatedEvent(string csoUsername, List<Conference> conferences)
        {
            var dtos = conferences.Select(x => new UpdatedAllocationDto
            {
                CaseName = x.CaseName,
                JudgeDisplayName = x.GetJudge().DisplayName,
                ScheduledDateTime = x.ScheduledDateTime
            }).ToList();
            await _hubContext.Clients.Group(csoUsername.ToLowerInvariant()).AllocationHearings(dtos);
        }
    }
}
