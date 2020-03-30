using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using Newtonsoft.Json;
using VideoWeb.Common.Models;
using VideoWeb.Services.Video;

namespace VideoWeb.Common.Caching
{
    public class DistributedConferenceCache : IConferenceCache
    {
        private readonly IDistributedCache _distributedCache;

        public DistributedConferenceCache(IDistributedCache distributedCache)
        {
            _distributedCache = distributedCache;
        }

        public Task AddConferenceToCache(ConferenceDetailsResponse conferenceResponse)
        {
            var conference = ConferenceCacheMapper.MapConferenceToCacheModel(conferenceResponse);
            var serialisedConference = JsonConvert.SerializeObject(conference);

            return _distributedCache.SetStringAsync(conference.Id.ToString(), serialisedConference,
                new DistributedCacheEntryOptions()
                {
                    SlidingExpiration = TimeSpan.FromHours(4)
                });

        }

        public Conference GetConference(Guid id)
        {
            var conferenceSerialised = _distributedCache.GetString(id.ToString());
            var conference = JsonConvert.DeserializeObject<Conference>(conferenceSerialised);
            return conference;
        }
    }
}
