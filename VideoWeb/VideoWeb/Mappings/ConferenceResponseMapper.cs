using System;
using System.Linq;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;
using UserRole = VideoWeb.Services.Video.UserRole;

namespace VideoWeb.Mappings
{
    public class ConferenceResponseMapper
    {
        public ConferenceResponse MapConferenceDetailsToResponseModel(ConferenceDetailsResponse conference)
        {
            var status = ConferenceStatus.NotStarted;
            if (conference.Current_status != null)
            {
                status = Enum.Parse<ConferenceStatus>(conference.Current_status.GetValueOrDefault()
                    .ToString());
            }


            var participantMapper = new ParticipantResponseMapper();
            var participants = conference.Participants
                .OrderBy(x => x.Case_type_group)
                .Select(x => participantMapper.MapParticipantToResponseModel(x))
                .ToList();

            var response = new ConferenceResponse
            {
                Id = conference.Id.GetValueOrDefault(),
                CaseName = conference.Case_name,
                CaseNumber = conference.Case_number,
                CaseType = conference.Case_type,
                ScheduledDateTime = conference.Scheduled_date_time.GetValueOrDefault(),
                ScheduledDuration = conference.Scheduled_duration.GetValueOrDefault(),
                Status = status,
                Participants = participants
            };

            if (conference.Meeting_room == null) return response;

            response.AdminIFrameUri = conference.Meeting_room.Admin_uri;
            response.JudgeIFrameUri = conference.Meeting_room.Judge_uri;
            response.ParticipantUri = conference.Meeting_room.Participant_uri;
            response.PexipNodeUri = conference.Meeting_room.Pexip_node;

            var tiledParticipants = conference.Participants.Where(x =>
                x.User_role == UserRole.Individual || x.User_role == UserRole.Representative).ToList();

            var partyGroups = tiledParticipants.GroupBy(x => x.Case_type_group).ToList();
            foreach (var group in partyGroups)
            {
                var pats = group.ToList();
                var position = partyGroups.IndexOf(group) + 1;
                foreach (var p in pats)
                {
                    var participant = response.Participants.Find(x => x.Id == p.Id);
                    participant.TiledDisplayName = $"T{position};{participant.DisplayName};{participant.Id}";
                    position += 2;
                }
            }
            
            return response;
        }
    }
}