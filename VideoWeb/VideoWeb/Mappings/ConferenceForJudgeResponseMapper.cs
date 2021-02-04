using System;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using Conference = VideoApi.Contract.Responses.ConferenceForJudgeResponse;
using ConferenceForJudgeResponse = VideoWeb.Contract.Responses.ConferenceForJudgeResponse;
using Participant = VideoApi.Contract.Responses.ParticipantForJudgeResponse;

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
                CaseName = conference.CaseName,
                CaseNumber = conference.CaseNumber,
                CaseType = conference.CaseType,
                ScheduledDuration = conference.ScheduledDuration,
                ScheduledDateTime = conference.ScheduledDateTime,
                Participants = conference.Participants.Select(_participantForJudgeResponseMapper.Map).ToList(),
                NumberOfEndpoints = conference.NumberOfEndpoints
            };
        }
    }
}
