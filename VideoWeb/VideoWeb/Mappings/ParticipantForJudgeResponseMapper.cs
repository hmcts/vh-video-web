using System;
using VideoWeb.Common.Models;
using Participant = VideoApi.Contract.Responses.ParticipantForJudgeResponse;
using ParticipantForJudgeResponse = VideoWeb.Contract.Responses.ParticipantForJudgeResponse;

namespace VideoWeb.Mappings
{
    public class ParticipantForJudgeResponseMapper : IMapTo<Participant, ParticipantForJudgeResponse>
    {
        public ParticipantForJudgeResponse Map(Participant participant)
        {
            return new ParticipantForJudgeResponse
            {
                Role = Enum.Parse<Role>(participant.Role.ToString()),
                DisplayName = participant.DisplayName,
                Representee = participant.Representee,
                CaseTypeGroup = participant.CaseTypeGroup,
                HearingRole = participant.HearingRole
            };
        }
    }
}
