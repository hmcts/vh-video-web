using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using VideoApi.Contract.Requests;
using VideoWeb.EventHub.Hub;
using VideoWeb.Helpers.Interfaces;

namespace VideoWeb.Helpers;

public class AllocationHearingsEventNotifier(
    IHubContext<EventHub.Hub.EventHub, IEventHubClient> hubContext)
    : IAllocationHearingsEventNotifier
{
    public async Task PushAllocationHearingsEvent(string csoUserName, IList<HearingDetailRequest> hearings)
    {
        if (!hearings.Any())
        {
            return;
        }
        
        await hubContext.Clients.Group(csoUserName.ToLowerInvariant())
            .AllocationHearings(csoUserName, hearings.ToList());
    }
}
