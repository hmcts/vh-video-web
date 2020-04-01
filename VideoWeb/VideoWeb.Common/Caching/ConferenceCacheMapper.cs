using System;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Services.Video;

namespace VideoWeb.Common.Caching
{
    public static class ConferenceCacheMapper
    {
        public static Conference MapConferenceToCacheModel(ConferenceDetailsResponse conferenceResponse)
        {
            var participants = conferenceResponse
                .Participants
                .Select(participant => new Participant
                {
                    Id = participant.Id, 
                    DisplayName = participant.Display_name, 
                    Role = (Role) Enum.Parse(typeof(Role), participant.User_role.ToString()), 
                    Username = participant.Username
                })
                .ToList();

            var conference = new Conference
            {
                Id = conferenceResponse.Id,
                HearingId = conferenceResponse.Hearing_id,
                Participants = participants
            };
            return conference;
        }
    }
}
