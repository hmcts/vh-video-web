using System;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using ParticipantStatus = VideoWeb.Common.Models.ParticipantStatus;

namespace VideoWeb.Mappings;

public static class ParticipantResponseForVhoMapper
{
    public static ParticipantResponseVho Map(Participant participant)
    {
        var status = Enum.Parse<ParticipantStatus>(participant.ParticipantStatus.ToString());
        var role = Enum.Parse<Role>(participant.Role.ToString());
        
        var response = new ParticipantResponseVho
        {
            Id = participant.Id,
            Status = status,
            Role = role,
            DisplayName = participant.DisplayName,
            CurrentRoom = RoomSummaryResponseMapper.Map(participant.CurrentRoom),
            InterpreterRoom = RoomSummaryResponseMapper.Map(participant.InterpreterRoom),
            Name = participant.FullTitledName,
            LinkedParticipants = participant.LinkedParticipants.Select(lp => new LinkedParticipantResponse
            {
                LinkedId = lp.LinkedId,
                LinkType = lp.LinkType
            }).ToList()
        };
        
        if (role == Role.Judge)
        {
            response.TiledDisplayName = $"T{0};{participant.DisplayName};{participant.Id}";
        }
        
        return response;
    }
}
