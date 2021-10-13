using Microsoft.Extensions.Caching.Distributed;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;

namespace VideoWeb.Common.Caching
{
    public class DistributedConferenceLayoutCache : IConferenceLayoutCache
    {
        private readonly IDistributedCache _distributedCache;
        private readonly string _cachePrefix = "layout_";

        public DistributedConferenceLayoutCache(IDistributedCache distributedCache)
        {
            _distributedCache = distributedCache;
        }

        public async Task Write(Guid conferenceId, HearingLayout layout)
        {
            var serialisedLayout = JsonConvert.SerializeObject(layout, CachingHelper.SerializerSettings);
            var data = Encoding.UTF8.GetBytes(serialisedLayout);
            await _distributedCache.SetAsync(GetKey(conferenceId), data,
                new DistributedCacheEntryOptions
                {
                    SlidingExpiration = TimeSpan.FromHours(4)
                });
        }

        public async Task<HearingLayout?> Read(Guid conferenceId)
        {
            try
            {
                var data = await _distributedCache.GetAsync(GetKey(conferenceId));
                var profileSerialised = Encoding.UTF8.GetString(data);
                var layout =
                    JsonConvert.DeserializeObject<HearingLayout>(profileSerialised,
                        CachingHelper.SerializerSettings);
                return layout;
            }
            catch (Exception)
            {
                return null;
            }
        }
        private string GetKey(Guid conferenceId)
        {
            return $"{_cachePrefix}{conferenceId}";
        }
    }
}
