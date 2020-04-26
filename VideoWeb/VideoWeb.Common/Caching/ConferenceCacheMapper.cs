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
                    RefId = participant.Ref_id,
                    Name = participant.Name,
                    DisplayName = participant.Display_name, 
                    Role = (Role) Enum.Parse(typeof(Role), participant.User_role.ToString()), 
                    ParticipantStatus = (ParticipantStatus) Enum.Parse(typeof(ParticipantStatus), participant.Current_status.ToString()),
                    Username = participant.Username,
                    CaseTypeGroup = participant.Case_type_group
                })
                .ToList();

            var conference = new Conference
            {
                Id = conferenceResponse.Id,
                HearingId = conferenceResponse.Hearing_id,
                Participants = participants,
                HearingVenueName = conferenceResponse.Hearing_venue_name
            };
            return conference;
        }
    }
}
