using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using VideoWeb.EventHub.Models;
using VideoWeb.Services.Video;
using UserRole = VideoWeb.Contract.Responses.UserRole;

namespace VideoWeb
{
    public class ConferenceCache
    {
        protected ConferenceCache() { }
        public static async Task AddConferenceToCache(ConferenceDetailsResponse conferenceResponse, IMemoryCache memoryCache)
        {
            var participants = new List<Participant>();
            foreach (var participant in conferenceResponse.Participants)
            {
                participants.Add(new Participant
                {
                    Id = participant.Id.Value,
                    DisplayName = participant.Display_name,
                    Role = (VideoWeb.EventHub.Enums.UserRole)Enum.Parse(typeof(UserRole), participant.User_role.ToString()),
                    Username = participant.Username
                });
            }

            var conference = new Conference
            {
                Id = conferenceResponse.Id.Value,
                HearingId = conferenceResponse.Hearing_id.Value,
                Participants = participants
            };

            await memoryCache.GetOrCreateAsync(conference.Id, entry =>
            {
                entry.SlidingExpiration = TimeSpan.FromHours(4);
                return Task.FromResult(conference);
            });
        }
    }
}
