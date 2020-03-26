using System;
using System.Linq;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;
using UserRole = VideoWeb.Contract.Responses.UserRole;

namespace VideoWeb.Mappings
{
    public static class ConferenceForJudgeResponseMapper
    {
        public static ConferenceForJudgeResponse MapConferenceSummaryToModel(ConferenceSummaryResponse conference)
        {
            return new ConferenceForJudgeResponse
            {
                Id = conference.Id,
                Status = Enum.Parse<ConferenceStatus>(conference.Status.ToString()),
                CaseName = conference.Case_name,
                CaseNumber = conference.Case_number,
                CaseType = conference.Case_type,
                ScheduledDuration = conference.Scheduled_duration,
                ScheduledDateTime = conference.Scheduled_date_time,
                Participants = conference.Participants
                    .Select(ParticipantForJudgeResponseMapper.MapParticipantSummaryToModel).ToList()
            };
        }
    }
    
    public static class ParticipantForJudgeResponseMapper
    {
        public static ParticipantForJudgeResponse MapParticipantSummaryToModel(ParticipantSummaryResponse participant)
        {
            return new ParticipantForJudgeResponse
            {
                Role = Enum.Parse<UserRole>(participant.User_role.ToString()),
                DisplayName = participant.Display_name,
                Representee = participant.Representee,
                CaseTypeGroup = participant.Case_group
            };
        }
    }
}
