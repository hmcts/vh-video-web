using System;
using System.Linq;
using VideoWeb.Common.Models;
using Conference = VideoWeb.Services.Video.ConferenceForJudgeResponse;
using Participant = VideoWeb.Services.Video.ParticipantForJudgeResponse;
using ConferenceForJudgeResponse = VideoWeb.Contract.Responses.ConferenceForJudgeResponse;
using ParticipantForJudgeResponse = VideoWeb.Contract.Responses.ParticipantForJudgeResponse;

namespace VideoWeb.Mappings
{
    public static class ConferenceForJudgeResponseMapper
    {
        public static ConferenceForJudgeResponse MapConferenceSummaryToModel(Conference conference)
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
                    .Select(ParticipantForJudgeResponseMapper.MapParticipantSummaryToModel).ToList(),
                NumberOfEndpoints = conference.Number_of_endpoints
            };
        }
    }

    public static class ParticipantForJudgeResponseMapper
    {
        public static ParticipantForJudgeResponse MapParticipantSummaryToModel(Participant participant)
        {
            return new ParticipantForJudgeResponse
            {
                Role = Enum.Parse<Role>(participant.Role.ToString()),
                DisplayName = participant.Display_name,
                Representee = participant.Representee,
                CaseTypeGroup = participant.Case_type_group
            };
        }
    }
}
