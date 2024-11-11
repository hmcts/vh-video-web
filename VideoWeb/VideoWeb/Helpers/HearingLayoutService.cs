using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.Common;
using VideoWeb.Common.Caching;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Services;

namespace VideoWeb.Helpers;

public class HearingLayoutService(
    ILogger<HearingLayoutService> logger,
    IConferenceService conferenceService,
    IHearingLayoutCache hearingLayoutCache,
    IHubContext<EventHub.Hub.EventHub, IEventHubClient> hubContext)
    : IHearingLayoutService
{
    private async Task SetHearingLayoutInCache(Guid conferenceId, HearingLayout newLayout, CancellationToken cancellationToken = default)
    {
        await hearingLayoutCache.WriteToCache(conferenceId, newLayout, cancellationToken);
    }
    
    private async Task<HearingLayout?> GetHearingLayoutFromCache(Guid conferenceId, CancellationToken cancellationToken = default)
    {
        return await hearingLayoutCache.ReadFromCache(conferenceId, cancellationToken);
    }
    
    public async Task<HearingLayout?> GetCurrentLayout(Guid conferenceId, CancellationToken cancellationToken = default)
    {
        try
        {
            var conference = await conferenceService.GetConference(conferenceId, cancellationToken);
            var hearingLayout = await GetHearingLayoutFromCache(conferenceId, cancellationToken);
            return hearingLayout ?? conference.GetRecommendedLayout();
        }
        catch (VideoApiException exception)
        {
            if (exception.StatusCode != 404) throw;
        }
        
        return null;
    }
    
    public async Task UpdateLayout(Guid conferenceId, Guid changedById, HearingLayout newLayout, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("Attempting to change layout for {ConferenceId} to {NewLayout} by participant with the ID {ChangedById}", conferenceId, newLayout, changedById);
        
        var conference = await conferenceService.GetConference(conferenceId, cancellationToken);

        var hearingLayout = await GetHearingLayoutFromCache(conferenceId, cancellationToken);
        var oldLayout = hearingLayout ?? conference.GetRecommendedLayout();
        
        logger.LogDebug("Got old layout {OldLayout} for {ConferenceId} requested by participant with the ID {ChangedById}", oldLayout, newLayout, changedById);
        
        await SetHearingLayoutInCache(conferenceId, newLayout, cancellationToken);

        var hosts = conference.Participants
            .Where(participant => participant.IsHost())
            .Select(participant => participant.Username.ToLowerInvariant()).ToList();
        
        logger.LogTrace("Sending message to {Hosts} for layout change in {ConferenceId} requested by participant with the ID {ChangedById}", hosts.ToArray(), conferenceId, changedById);
        
        await hubContext.Clients
            .Groups(hosts)
            .HearingLayoutChanged(conferenceId, changedById, newLayout, oldLayout);
        
        logger.LogTrace(
            "Hearing layout changed for {ConferenceId} from {OldLayout} to {NewLayout} by participant with the ID {ChangedById}",
            conferenceId, oldLayout, newLayout, changedById);
    }
}
