using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using VideoWeb.Common;
using VideoWeb.EventHub.Hub;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.Mappings;

namespace VideoWeb.Helpers;

public class AllocationHearingsEventNotifier(
    IHubContext<EventHub.Hub.EventHub, IEventHubClient> hubContext,
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
            conference.AllocatedCsoId = update.AllocatedCsoId;
            conference.AllocatedCso = update.AllocatedCsoUsername;
            await conferenceService.UpdateConferenceAsync(conference);
        }
        var updatedAllocationDtos = conferences
            .Select(ConferenceDetailsToUpdatedAllocationDtoMapper.MapToUpdatedAllocationDto).ToList();
        
        await hubContext.Clients.Group(update.AllocatedCsoUsername.ToLowerInvariant())
            .AllocationsUpdated(updatedAllocationDtos);
    }
}


