using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using VideoWeb.EventHub.Models;
using VideoWeb.Services.Video;
using UserRole = VideoWeb.Contract.Responses.UserRole;

namespace VideoWeb
{   public interface IConferenceCache
    {
        Task AddConferenceToCache(ConferenceDetailsResponse conferenceResponse);
    }

    public class ConferenceCache :IConferenceCache
    {
        private readonly IMemoryCache _memoryCache;

        public ConferenceCache(IMemoryCache memoryCache) 
        {
            _memoryCache = memoryCache;
        }

        public  async Task AddConferenceToCache(ConferenceDetailsResponse conferenceResponse)
        {
            var participants = conferenceResponse
                .Participants
                .Select(participant => new Participant
                {
                    Id = participant.Id, 
                    DisplayName = participant.Display_name, 
                    Role = (VideoWeb.EventHub.Enums.UserRole) Enum.Parse(typeof(UserRole), participant.User_role.ToString()), 
                    Username = participant.Username
                })
                .ToList();

            var conference = new Conference
            {
                Id = conferenceResponse.Id,
                HearingId = conferenceResponse.Hearing_id,
                Participants = participants
            };
            
            await _memoryCache.GetOrCreateAsync(conference.Id, entry =>
            {
                entry.SlidingExpiration = TimeSpan.FromHours(4);
                return Task.FromResult(conference);
            });
        }
    }
}
