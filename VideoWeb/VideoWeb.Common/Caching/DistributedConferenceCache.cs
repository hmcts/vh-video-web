using System;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using VideoWeb.Common.Models;
using VideoWeb.Services.Video;

namespace VideoWeb.Common.Caching
{
    public class DistributedConferenceCache : IConferenceCache
    {
        private readonly IDistributedCache _distributedCache;
        private readonly ILogger<DistributedConferenceCache> _logger;

        public DistributedConferenceCache(IDistributedCache distributedCache, ILogger<DistributedConferenceCache> logger)
        {
            _distributedCache = distributedCache;
            _logger = logger;
        }

        public Task AddConferenceToCache(ConferenceDetailsResponse conferenceResponse)
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

        public Conference GetConference(Guid id)
        {
            _logger.LogTrace($"Cached GetConference: {id} ");
            try
            {
                var data = _distributedCache.Get(id.ToString());
                _logger.LogTrace($"distribured cache: {data} ");
                var conferenceSerialised = Encoding.UTF8.GetString(data);
                var conference = JsonConvert.DeserializeObject<Conference>(conferenceSerialised, CachingHelper.SerializerSettings);
                _logger.LogTrace($"deserialised conference: {conference} ");
                return conference;
            }
            catch (Exception)
            {
                return null;
            }
        }
    }
}
