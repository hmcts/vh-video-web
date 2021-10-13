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
        Task<HearingLayout> GetCurrentLayout(Guid conferenceId);
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

        public Task<HearingLayout> GetCurrentLayout(Guid conferenceId)
        {
            throw new NotImplementedException();
        }

        public Task UpdateLayout(Guid conferenceId, HearingLayout hearingLayout)
        {
            throw new NotImplementedException();
        }
    }
}
