using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using VideoWeb.Common.Models;
using VideoApi.Contract.Responses;

namespace VideoWeb.Common.Caching
{
    public class ConferenceCache : IConferenceCache
    {
        private readonly IMemoryCache _memoryCache;

        public ConferenceCache(IMemoryCache memoryCache) 
        {
            _memoryCache = memoryCache;
        }

        public async Task AddConferenceAsync(ConferenceDetailsResponse conferenceResponse)
        {
            var conference = ConferenceCacheMapper.MapConferenceToCacheModel(conferenceResponse);
            await UpdateConferenceAsync(conference);
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
        
        
        public async Task UpdateConferenceAsync(Conference conference)
        {
            await _memoryCache.GetOrCreateAsync(conference.Id, entry =>
            {
                entry.SlidingExpiration = TimeSpan.FromHours(4);
                return Task.FromResult(conference);
            });
        }

        public async Task<Conference> GetOrAddConferenceAsync(Guid id, Func<Task<ConferenceDetailsResponse>> addConferenceDetailsFactory)
        {
            
            var conference = await Task.FromResult(_memoryCache.Get<Conference>(id));

            if (conference != null) return conference;
            var conferenceDetails = await addConferenceDetailsFactory();
            await AddConferenceAsync(conferenceDetails);
            conference = await Task.FromResult(_memoryCache.Get<Conference>(id));
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
    }
}
