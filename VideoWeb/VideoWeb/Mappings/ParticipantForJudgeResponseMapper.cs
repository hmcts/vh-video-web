using System;
using VideoWeb.Common.Models;
using VideoWeb.Mappings.Interfaces;
using Participant = VideoApi.Contract.Responses.ParticipantForHostResponse;
using ParticipantForJudgeResponse = VideoWeb.Contract.Responses.ParticipantForJudgeResponse;

namespace VideoWeb.Mappings
{
    public class ParticipantForJudgeResponseMapper : IMapTo<Participant, ParticipantForJudgeResponse>
    {
        public ParticipantForJudgeResponse Map(Participant participant)
        {
            return new ParticipantForJudgeResponse
            {   
                Id = participant.Id,
                Role = Enum.Parse<Role>(participant.Role.ToString()),
                DisplayName = participant.DisplayName,
                Representee = participant.Representee,
                CaseTypeGroup = participant.CaseTypeGroup,
                HearingRole = participant.HearingRole
            };
        }
    }
}
