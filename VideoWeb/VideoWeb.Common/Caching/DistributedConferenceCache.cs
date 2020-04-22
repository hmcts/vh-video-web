using System;
using System.Text;
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

        public Task AddConferenceToCacheAsync(ConferenceDetailsResponse conferenceResponse)
        {
            var conference = ConferenceCacheMapper.MapConferenceToCacheModel(conferenceResponse);
            var serialisedConference = JsonConvert.SerializeObject(conference, CachingHelper.SerializerSettings);

            var data = Encoding.UTF8.GetBytes(serialisedConference);

            return _distributedCache.SetAsync(conference.Id.ToString(), data,
                new DistributedCacheEntryOptions
                {
                    SlidingExpiration = TimeSpan.FromHours(4)
                });

        }

        public async Task<Conference> GetConferenceAsync(Guid id)
        {
            try
            {
                var data = await _distributedCache.GetAsync(id.ToString());
                var conferenceSerialised = Encoding.UTF8.GetString(data);
                var conference = JsonConvert.DeserializeObject<Conference>(conferenceSerialised, CachingHelper.SerializerSettings);
                return conference;
            }
            catch (Exception)
            {
                return null;
            }
        }
    }
}
