using System;
using VideoWeb.Common.Models;
using Participant = VideoApi.Contract.Responses.ParticipantForHostResponse;
using ParticipantForHostResponse = VideoWeb.Contract.Responses.ParticipantForHostResponse;

namespace VideoWeb.Mappings;

public static class ParticipantForHostResponseMapper
{
    public static ParticipantForHostResponse Map(Participant participant)
    {
        return new ParticipantForHostResponse
        {
            Id = participant.Id,
            Role = Enum.Parse<Role>(participant.Role.ToString()),
            DisplayName = participant.DisplayName,
            Representee = participant.Representee,
            HearingRole = participant.HearingRole,
        };
    }
}
