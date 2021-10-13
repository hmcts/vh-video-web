using Microsoft.AspNetCore.SignalR;
using System;
using System.Linq;
using System.Threading.Tasks;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Hub;

namespace VideoWeb.Helpers
{
    public interface IConferenceLayoutService
    {
        Task UpdateLayout(Guid conferenceId, HearingLayout newLayout);
        Task<HearingLayout?> GetCurrentLayout(Guid conferenceId);
    }

    public class ConferenceLayoutService : IConferenceLayoutService
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly IConferenceCache _conferenceCache;
        private readonly IHubContext<EventHub.Hub.EventHub, IEventHubClient> _hubContext;

        public ConferenceLayoutService(IVideoApiClient videoApiClient, IConferenceCache conferenceCache, IHubContext<EventHub.Hub.EventHub, IEventHubClient> hubContext)
        {
            _videoApiClient = videoApiClient;
            _conferenceCache = conferenceCache;
            _hubContext = hubContext;
        }

        private async Task<Conference> GetConferenceFromCache(Guid conferenceId)
        {
            return await _conferenceCache.GetOrAddConferenceAsync(conferenceId, async () => await _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId));
        }

        public async Task<HearingLayout?> GetCurrentLayout(Guid conferenceId)
        {
            try
            {
                return (await GetConferenceFromCache(conferenceId)).HearingLayout;
            }
            catch (VideoApiException exception)
            {
                if (exception.StatusCode != 404) throw;
            }

            return null;
        }

        public async Task UpdateLayout(Guid conferenceId, HearingLayout newLayout)
        {
            Conference conference;
            try
            {
                conference = await GetConferenceFromCache(conferenceId);
            }
            catch (Exception exception)
            {
                return;
            }

            var oldLayout = conference.HearingLayout;
            conference.HearingLayout = newLayout;

            await _conferenceCache.UpdateConferenceAsync(conference);
            await _hubContext.Clients
                            .Groups(conference.Participants
                            .Where(participant => participant.Role == Role.Judge || participant.Role == Role.StaffMember)
                            .Select(participant => participant.Username).ToList())
                            .HearingLayoutChanged(conferenceId, newLayout, oldLayout);
        }
    }
}
