using System;
using VideoWeb.Common.Models;
using VideoWeb.Mappings.Interfaces;
using Participant = VideoWeb.Services.Video.ParticipantForJudgeResponse;
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
                DisplayName = participant.Display_name,
                Representee = participant.Representee,
                CaseTypeGroup = participant.Case_type_group,
                HearingRole = participant.Hearing_role
            };
        }
    }
}
