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
        private readonly IHubContext<EventHub.Hub.EventHub, IEventHubClient> _hubContext;

        public HearingLayoutService(ILogger<HearingLayoutService> logger, IVideoApiClient videoApiClient, IConferenceCache conferenceCache, IHearingLayoutCache hearingLayoutCache, IHubContext<EventHub.Hub.EventHub, IEventHubClient> hubContext)
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
            await _hearingLayoutCache.Write(conferenceId, newLayout);
        }

        private async Task<HearingLayout?> GetHearingLayoutFromCache(Guid conferenceId)
        {
            return await _hearingLayoutCache.Read(conferenceId);
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
            Conference conference;
            try
            {
                conference = await GetConferenceFromCache(conferenceId);
            }
            catch (Exception exception)
            {
                _logger.LogError($"Failed to update layout for conferece {conferenceId} to {newLayout} change requested by {changedById}", exception);
                return;
            }

            var hearingLayout = await GetHearingLayoutFromCache(conferenceId);
            var oldLayout = hearingLayout ?? conference.GetRecommendedLayout();

            _logger.LogWarning($"Hearing layout changed for {conferenceId} from {oldLayout} to {newLayout} by participant with the ID {changedById}.");

            await SetHearingLayoutInCache(conferenceId, newLayout);

            _logger.LogWarning($"Set hearing layout in the cache for {conferenceId}.");


            var hosts = conference.Participants
                            .Where(participant => participant.IsHost())
                            .Select(participant => participant.Username.ToLowerInvariant());

            _logger.LogWarning($"Sending message to {hosts} for layout change in {conferenceId}.");

            await _hubContext.Clients
                            .Groups(hosts.ToList())
                            .HearingLayoutChanged(conferenceId, changedById, newLayout, oldLayout);
        }
    }
}
