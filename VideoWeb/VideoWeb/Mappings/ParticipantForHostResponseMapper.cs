using System;
using VideoApi.Contract.Responses;
using ParticipantForHostResponse = VideoWeb.Contract.Responses.ParticipantForHostResponse;
using Role = VideoWeb.Common.Models.Role;

namespace VideoWeb.Mappings;

public static class ParticipantForHostResponseMapper
{
    public static ParticipantForHostResponse Map(ParticipantCoreResponse participant)
    {
        return new ParticipantForHostResponse
        {
            Id = participant.Id,
            DisplayName = participant.DisplayName,
            Role = Enum.Parse<Role>(participant.UserRole.ToString())
        };
    }
}
