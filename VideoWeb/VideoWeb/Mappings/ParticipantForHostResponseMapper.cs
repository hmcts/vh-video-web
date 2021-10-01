using System;
using VideoWeb.Common.Models;
using VideoWeb.Mappings.Interfaces;
using Participant = VideoApi.Contract.Responses.ParticipantForHostResponse;
using ParticipantForHostResponse = VideoWeb.Contract.Responses.ParticipantForHostResponse;

namespace VideoWeb.Mappings
{
    public class ParticipantForHostResponseMapper : IMapTo<Participant, ParticipantForHostResponse>
    {
        public ParticipantForHostResponse Map(Participant participant)
        {
            return new ParticipantForHostResponse
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
