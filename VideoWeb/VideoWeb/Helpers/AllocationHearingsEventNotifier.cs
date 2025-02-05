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
        var usernamesToNotify = new List<string>();
        foreach (var conference in conferences)
        {
            var previouslyAllocatedCsoUsername = conference.AllocatedCso;
            var newAllocatedCsoUsername = update.AllocatedCsoUsername;
            
            if (!string.IsNullOrEmpty(previouslyAllocatedCsoUsername))
                usernamesToNotify.Add(previouslyAllocatedCsoUsername);
            usernamesToNotify.Add(newAllocatedCsoUsername);
    
            conference.AllocatedCsoId = update.AllocatedCsoId;
            conference.AllocatedCso = update.AllocatedCsoUsername;
            await conferenceService.UpdateConferenceAsync(conference);
        }
        var updatedAllocationDtos = conferences
            .Select(ConferenceDetailsToUpdatedAllocationDtoMapper.MapToUpdatedAllocationDto).ToList();
    
        foreach (var username in usernamesToNotify)
        {
            await hubContext.Clients.Group(username.ToLowerInvariant())
                .AllocationsUpdated(updatedAllocationDtos);
        }
    }
}


