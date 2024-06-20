using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading.Tasks;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Services;

namespace VideoWeb.Helpers
{
    public class HearingLayoutService : IHearingLayoutService
    {
        private readonly ILogger<HearingLayoutService> _logger;
        private readonly IVideoApiClient _videoApiClient;
        private readonly IConferenceCache _conferenceCache;
        private readonly IHearingLayoutCache _hearingLayoutCache;
        private readonly IHubContext<EventHub.Hub.EventHubPPS2, IEventHubClient> _hubContext;

        public HearingLayoutService(ILogger<HearingLayoutService> logger, IVideoApiClient videoApiClient, IConferenceCache conferenceCache, IHearingLayoutCache hearingLayoutCache, IHubContext<EventHub.Hub.EventHubPPS2, IEventHubClient> hubContext)
        {
            _logger = logger;
            _videoApiClient = videoApiClient;
            _conferenceCache = conferenceCache;
            _hearingLayoutCache = hearingLayoutCache;
            _hubContext = hubContext;
        }

        private async Task<Conference> GetConferenceFromCache(Guid conferenceId)
        {
            return await _conferenceCache.GetOrAddConferenceAsync(conferenceId, async () => await _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId));
        }

        private async Task SetHearingLayoutInCache(Guid conferenceId, HearingLayout newLayout)
        {
            await _hearingLayoutCache.WriteToCache(conferenceId, newLayout);
        }

        private async Task<HearingLayout?> GetHearingLayoutFromCache(Guid conferenceId)
        {
            return await _hearingLayoutCache.ReadFromCache(conferenceId);
        }

        public async Task<HearingLayout?> GetCurrentLayout(Guid conferenceId)
        {
            try
            {
                var conference = await GetConferenceFromCache(conferenceId);
                var hearingLayout = await GetHearingLayoutFromCache(conferenceId);
                return hearingLayout ?? conference.GetRecommendedLayout();
            }
            catch (VideoApiException exception)
            {
                if (exception.StatusCode != 404) throw;
            }

            return null;
        }

        public async Task UpdateLayout(Guid conferenceId, Guid changedById, HearingLayout newLayout)
        {
            _logger.LogInformation("Attempting to change layout for {conferenceId} to {newLayout} by participant with the ID {changedById}.", conferenceId, newLayout, changedById);

            Conference conference = await GetConferenceFromCache(conferenceId);

            _logger.LogDebug("Got conference {conferenceId} to change layout to {newLayout} requested by participant with the ID {changedById}.", conferenceId, newLayout, changedById);


            var hearingLayout = await GetHearingLayoutFromCache(conferenceId);
            var oldLayout = hearingLayout ?? conference.GetRecommendedLayout();

            _logger.LogDebug("Got old layout {oldLayout} for {conferenceId} requested by participant with the ID {changedById}.", oldLayout, newLayout, changedById);

            await SetHearingLayoutInCache(conferenceId, newLayout);

            _logger.LogDebug("Set hearing layout in the cache for {conferenceId} requested by participant with the ID {changedById}.", conferenceId, changedById);

            var hosts = conference.Participants
                            .Where(participant => participant.IsHost())
                            .Select(participant => participant.Username.ToLowerInvariant()).ToList();

            _logger.LogTrace("Sending message to {hosts} for layout change in {conferenceId} requested by participant with the ID {changedById}.", hosts.ToArray(), conferenceId, changedById);
            
            await _hubContext.Clients
                .Groups(hosts)
                .HearingLayoutChanged(conferenceId, changedById, newLayout, oldLayout);

            _logger.LogTrace("Hearing layout changed for {conferenceId} from {oldLayout} to {newLayout} by participant with the ID {changedById}.", conferenceId, oldLayout, newLayout, changedById);
        }
    }
}
