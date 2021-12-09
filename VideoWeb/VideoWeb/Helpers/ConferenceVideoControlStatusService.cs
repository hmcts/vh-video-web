using System;
using System.Threading.Tasks;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Services;

namespace VideoWeb.Helpers
{
    public class ConferenceVideoControlStatusService : IConferenceVideoControlStatusService
    {
        private readonly IConferenceVideoControlStatusCache _conferenceVideoControlStatusCache;

        public ConferenceVideoControlStatusService(IConferenceVideoControlStatusCache conferenceVideoControlStatusCache)
        {
            _conferenceVideoControlStatusCache = conferenceVideoControlStatusCache;
        }
        
        public async Task SetVideoControlStateForConference(Guid conferenceId,
            ConferenceVideoControlStatuses? conferenceVideoControlStatuses)
        {
            await _conferenceVideoControlStatusCache.WriteToCache(conferenceId, conferenceVideoControlStatuses);
        }
        
        public Task<ConferenceVideoControlStatuses?> GetVideoControlStateForConference(Guid conferenceId)
        {
            return _conferenceVideoControlStatusCache.ReadFromCache(conferenceId);
        }
    }
}
