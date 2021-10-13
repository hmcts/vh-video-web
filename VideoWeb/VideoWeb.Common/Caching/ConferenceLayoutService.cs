using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using VideoApi.Client;
using VideoApi.Contract.Requests;

namespace VideoWeb.Common.Caching
{
    public interface IConferenceLayoutService
    {
        Task UpdateLayout(Guid conferenceId, HearingLayout hearingLayout);
        Task<HearingLayout?> GetCurrentLayout(Guid conferenceId);
    }

    public class ConferenceLayoutService : IConferenceLayoutService
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly IConferenceCache _conferenceCache;

        public ConferenceLayoutService(IVideoApiClient videoApiClient, IConferenceCache conferenceCache)
        {
            _videoApiClient = videoApiClient;
            _conferenceCache = conferenceCache;
        }

        public async Task<HearingLayout?> GetCurrentLayout(Guid conferenceId)
        {
            try
            {
                var cachedConference = await _conferenceCache.GetOrAddConferenceAsync(conferenceId, async () => await _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId));
                return cachedConference.HearingLayout;
            }
            catch (VideoApiException exception)
            {
                if (exception.StatusCode != 404) throw;
            }

            return null;
        }

        public Task UpdateLayout(Guid conferenceId, HearingLayout hearingLayout)
        {
            throw new NotImplementedException();
        }
    }
}
