using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using VideoWeb.Common;
using VideoWeb.EventHub.Hub;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.Mappings;
using Hub = VideoWeb.EventHub.Hub;

namespace VideoWeb.Helpers;

public class AllocationHearingsEventNotifier(
    IHubContext<Hub.EventHub, IEventHubClient> hubContext,
    IConferenceService conferenceService)
    : IAllocationHearingsEventNotifier
{
    public async Task PushAllocationHearingsEvent(UpdatedAllocationJusticeUserDto update, List<Guid> conferenceIds)
    {
        if (conferenceIds.Count == 0)
        {
            return;
        }
    
        var conferences = (await conferenceService.GetConferences(conferenceIds)).ToList();
        foreach (var conference in conferences)
        {
            conference.UpdateAllocation(update.AllocatedCsoId, update.AllocatedCsoFullName,
                update.AllocatedCsoUsername);
            await conferenceService.UpdateConferenceAsync(conference);
        }
        var updatedAllocationDtos = conferences
            .Select(ConferenceDetailsToUpdatedAllocationDtoMapper.MapToUpdatedAllocationDto).ToList();

        await hubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
            .AllocationsUpdated(updatedAllocationDtos);
    }
}


