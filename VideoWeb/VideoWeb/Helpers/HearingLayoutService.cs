using Microsoft.AspNetCore.SignalR;
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
        private readonly IVideoApiClient _videoApiClient;
        private readonly IConferenceCache _conferenceCache;
        private readonly IHearingLayoutCache _conferenceLayoutCache;
        private readonly IHubContext<EventHub.Hub.EventHub, IEventHubClient> _hubContext;

        public HearingLayoutService(IVideoApiClient videoApiClient, IConferenceCache conferenceCache, IHearingLayoutCache conferenceLayoutCache, IHubContext<EventHub.Hub.EventHub, IEventHubClient> hubContext)
        {
            _videoApiClient = videoApiClient;
            _conferenceCache = conferenceCache;
            this._conferenceLayoutCache = conferenceLayoutCache;
            _hubContext = hubContext;
        }

        private async Task<Conference> GetConferenceFromCache(Guid conferenceId)
        {
            return await _conferenceCache.GetOrAddConferenceAsync(conferenceId, async () => await _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId));
        }

        private async Task SetConferenceLayoutInCache(Guid conferenceId, HearingLayout newLayout)
        {
            await _conferenceLayoutCache.Write(conferenceId, newLayout);
        }

        private async Task<HearingLayout?> GetConferenceLayoutFromCache(Guid conferenceId)
        {
            return await _conferenceLayoutCache.Read(conferenceId);
        }

        public async Task<HearingLayout?> GetCurrentLayout(Guid conferenceId)
        {
            try
            {
                var conference = await GetConferenceFromCache(conferenceId);
                var conferenceLayout = await GetConferenceLayoutFromCache(conferenceId);
                return conferenceLayout ?? conference.GetRecommendedLayout();
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
            catch (Exception)
            {
                return;
            }

            var conferenceLayout = await GetConferenceLayoutFromCache(conferenceId);
            var oldLayout = conferenceLayout ?? conference.GetRecommendedLayout();
            await SetConferenceLayoutInCache(conferenceId, newLayout);

            await _hubContext.Clients
                            .Groups(conference.Participants
                            .Where(participant => participant.Role == Role.Judge || participant.Role == Role.StaffMember)
                            .Select(participant => participant.Username.ToLowerInvariant()).ToList())
                            .HearingLayoutChanged(conferenceId, changedById, newLayout, oldLayout);
        }
    }
}
