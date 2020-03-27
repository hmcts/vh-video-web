using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings
{
    public static class ParticipantForUserResponseMapper
    {
        public static List<ParticipantForUserResponse> MapParticipants(IEnumerable<ParticipantSummaryResponse> participants)
        {
            return participants.Select(participant => new ParticipantForUserResponse
                {
                    Id = participant.Id,
                    Username = participant.Username,
                    DisplayName = participant.Display_name,
                    Status = Enum.Parse<ParticipantStatus>(participant.Status.ToString()),
                    Role = Enum.Parse<Role>(participant.User_role.ToString()),
                    Representee = string.IsNullOrWhiteSpace(participant.Representee) ? null : participant.Representee,
                    CaseTypeGroup = participant.Case_group
                })
                .ToList();
        }
    }
}
