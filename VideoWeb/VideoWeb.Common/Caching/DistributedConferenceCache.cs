using System;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;
using VideoWeb.Common.Models;
using VideoApi.Contract.Responses;

namespace VideoWeb.Common.Caching
{
    public class DistributedConferenceCache : RedisCacheBase<Guid, Conference>, IConferenceCache
    {
        public override DistributedCacheEntryOptions CacheEntryOptions { get; protected set; }
        private readonly IMemoryCache _memoryCache;

        public DistributedConferenceCache(IDistributedCache distributedCache  ,IMemoryCache memoryCache) : base(distributedCache)
        {
            _memoryCache = memoryCache;
            CacheEntryOptions = new DistributedCacheEntryOptions
            {
                SlidingExpiration = TimeSpan.FromHours(4)
            };
            
        }

        public async Task AddConferenceAsync(ConferenceDetailsResponse conferenceResponse)
        {
            var conference = ConferenceCacheMapper.MapConferenceToCacheModel(conferenceResponse);
            await UpdateConferenceAsync(conference);
        }

        public async Task UpdateConferenceAsync(Conference conference)
        {
            await WriteToCache(conference.Id, conference);
        }

        public async Task<Conference> GetOrAddConferenceAsync(Guid id, Func<Task<ConferenceDetailsResponse>> addConferenceDetailsFactory)
        {
            var conference = await ReadFromCache(id);

            if (conference != null) return conference;
            conference = ConferenceCacheMapper.MapConferenceToCacheModel(await addConferenceDetailsFactory());

            await WriteToCache(id, conference);

            return conference;
        }

        public async Task<RoomResponse> GetOrAddRoomAsync(string id, Func<Task<RoomResponse>> addRoomFactory)
        {
            RoomResponse roomResponse = await Task.FromResult(_memoryCache.Get<RoomResponse>(id));
            if (roomResponse == null)
            {
                roomResponse = await addRoomFactory();
                await AddRoomAsync(roomResponse, id);
            }
            roomResponse = await Task.FromResult(_memoryCache.Get<RoomResponse>(id));
            return roomResponse;
        }

        public override string GetKey(Guid key)
        {
            return key.ToString();
        }
        public async Task AddRoomAsync(RoomResponse roomResponse, string key)
        {
            await UpdateRoomAsync(roomResponse, key);
        }public async Task UpdateRoomAsync(RoomResponse roomResponse, string key)
        {
            await _memoryCache.GetOrCreateAsync(key, entry =>
            {
                entry.SlidingExpiration = TimeSpan.FromHours(4);
                return Task.FromResult(roomResponse);
            });
        }
    }
}
