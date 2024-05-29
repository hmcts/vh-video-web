using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using VideoWeb.Common.Models;
using VideoApi.Contract.Responses;
using ParticipantSummaryResponse = VideoApi.Contract.Responses.ParticipantSummaryResponse;

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
        
        // public async Task AddConferenceParticipantsAsync(ICollection<ParticipantSummaryResponse> participantsResponse, Guid conferenceId)
        // {
        //     var participants = participantsResponse.Select(ParticipantCacheMapper.MapParticipantToCacheModel);
        //     await UpdateParticipantsAsync(participants, conferenceId);
        // }
        //
        // public async Task UpdateParticipantsAsync(IEnumerable<Participant> participants, Guid id)
        // {
        //     var key = getKey(id);
        //     await _memoryCache.GetOrCreateAsync(key, entry =>
        //     {
        //         entry.SlidingExpiration = TimeSpan.FromHours(4);
        //         return Task.FromResult(participants);
        //     });
        // }
        //
        // public async Task<List<Participant>> GetOrAddParticipantsAsync(Guid id, Func<Task<ICollection<ParticipantSummaryResponse>>> addParticipantsDetailsFactory)
        // {
        //     var key = getKey(id);
        //     var participants = await Task.FromResult(_memoryCache.Get<List<Participant>>(key));
        //     
        //     if (participants != null) return participants;
        //     
        //     var participantsResponse = await addParticipantsDetailsFactory();
        //     await AddConferenceParticipantsAsync(participantsResponse, id);
        //     participants = await Task.FromResult(_memoryCache.Get<List<Participant>>(key));
        //     
        //     return participants;
        // }
        //
        // private string getKey(Guid id)
        // {
        //     return "participants_" + id;
        // }
    }
}
