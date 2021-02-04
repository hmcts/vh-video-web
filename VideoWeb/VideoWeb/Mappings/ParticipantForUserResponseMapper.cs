using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;
using VideoApi.Contract.Responses;

namespace VideoWeb.Mappings
{
    public class ParticipantForUserResponseMapper : IMapTo<IEnumerable<ParticipantSummaryResponse>, List<ParticipantForUserResponse>>
    {
        public List<ParticipantForUserResponse> Map(IEnumerable<ParticipantSummaryResponse> participants)
        {
            var mappedParticipants = participants.Select(participant => new ParticipantForUserResponse
                {
                    Id = participant.Id,
                    DisplayName = participant.DisplayName,
                    Status = Enum.Parse<ParticipantStatus>(participant.Status.ToString()),
                    Role = Enum.Parse<Role>(participant.UserRole.ToString()),
                    Representee = string.IsNullOrWhiteSpace(participant.Representee) ? null : participant.Representee,
                    CaseTypeGroup = participant.CaseGroup,
                    FirstName = participant.FirstName,
                    LastName = participant.LastName,
                    HearingRole = participant.HearingRole
                })
                .ToList();

            ParticipantTilePositionHelper.AssignTilePositions(mappedParticipants);
            
            return mappedParticipants;
        }
    }
}
