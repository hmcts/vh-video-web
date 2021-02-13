using System;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using Conference = VideoWeb.Services.Video.ConferenceForJudgeResponse;
using ConferenceForJudgeResponse = VideoWeb.Contract.Responses.ConferenceForJudgeResponse;
using Participant = VideoWeb.Services.Video.ParticipantForJudgeResponse;

namespace VideoWeb.Mappings
{
    public class ConferenceForJudgeResponseMapper : IMapTo<Conference, ConferenceForJudgeResponse>
    {
        private readonly IMapTo<Participant, ParticipantForJudgeResponse> _participantForJudgeResponseMapper;

        public ConferenceForJudgeResponseMapper(IMapTo<Participant, ParticipantForJudgeResponse> participantForJudgeResponseMapper)
        {
            _participantForJudgeResponseMapper = participantForJudgeResponseMapper;
        }

        public ConferenceForJudgeResponse Map(Conference conference)
        {
            return new ConferenceForJudgeResponse
            {
                Id = conference.Id,
                Status = Enum.Parse<ConferenceStatus>(conference.Status.ToString()),
                CaseName = conference.Case_name,
                CaseNumber = conference.Case_number,
                CaseType = conference.Case_type,
                ScheduledDuration = conference.Scheduled_duration,
                ClosedDateTime = conference.Closed_date_time,
                ScheduledDateTime = conference.Scheduled_date_time,
                Participants = conference.Participants.Select(_participantForJudgeResponseMapper.Map).ToList(),
                NumberOfEndpoints = conference.Number_of_endpoints
            };
        }
    }
}
