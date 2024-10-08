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

namespace VideoWeb.Helpers
{
    public class HearingLayoutService : IHearingLayoutService
    {
        private readonly ILogger<HearingLayoutService> _logger;
        private readonly IConferenceService _conferenceService;
        private readonly IHearingLayoutCache _hearingLayoutCache;
        private readonly IHubContext<EventHub.Hub.EventHub, IEventHubClient> _hubContext;

        public HearingLayoutService(ILogger<HearingLayoutService> logger, IConferenceService conferenceService, IHearingLayoutCache hearingLayoutCache, IHubContext<EventHub.Hub.EventHub, IEventHubClient> hubContext)
        {
            _logger = logger;
            _conferenceService = conferenceService;
            _hearingLayoutCache = hearingLayoutCache;
            _hubContext = hubContext;
        }
        
        private async Task SetHearingLayoutInCache(Guid conferenceId, HearingLayout newLayout, CancellationToken cancellationToken = default)
        {
            await _hearingLayoutCache.WriteToCache(conferenceId, newLayout, cancellationToken);
        }

        private async Task<HearingLayout?> GetHearingLayoutFromCache(Guid conferenceId, CancellationToken cancellationToken = default)
        {
            return await _hearingLayoutCache.ReadFromCache(conferenceId);
        }

        public async Task<HearingLayout?> GetCurrentLayout(Guid conferenceId, CancellationToken cancellationToken = default)
        {
            try
            {
                var conference = await _conferenceService.GetConference(conferenceId);
                var hearingLayout = await GetHearingLayoutFromCache(conferenceId);
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
            _logger.LogInformation("Attempting to change layout for {conferenceId} to {newLayout} by participant with the ID {changedById}.", conferenceId, newLayout, changedById);
            
            var conference = await _conferenceService.GetConference(conferenceId);

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
