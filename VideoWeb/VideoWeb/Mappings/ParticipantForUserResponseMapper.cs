using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings
{
    public class ParticipantForUserResponseMapper : IMapTo<IEnumerable<ParticipantSummaryResponse>, List<ParticipantForUserResponse>>
    {
        public List<ParticipantForUserResponse> Map(IEnumerable<ParticipantSummaryResponse> participants)
        {
            var mappedParticipants = participants.Select(participant => new ParticipantForUserResponse
                {
                    Id = participant.Id,
                    DisplayName = participant.Display_name,
                    Status = Enum.Parse<ParticipantStatus>(participant.Status.ToString()),
                    Role = Enum.Parse<Role>(participant.User_role.ToString()),
                    Representee = string.IsNullOrWhiteSpace(participant.Representee) ? null : participant.Representee,
                    CaseTypeGroup = participant.Case_group,
                    FirstName = participant.First_name,
                    LastName = participant.Last_name,
                    HearingRole = participant.Hearing_role
                })
                .ToList();

            ParticipantTilePositionHelper.AssignTilePositions(mappedParticipants);
            
            return mappedParticipants;
        }
    }
}
