using System;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using ParticipantResponse = VideoApi.Contract.Responses.ParticipantResponse;
using ParticipantStatus = VideoWeb.Common.Models.ParticipantStatus;

namespace VideoWeb.Mappings;

public static class ParticipantResponseForVhoMapper
{
    public static ParticipantResponseVho Map(ParticipantResponse participant)
    {
        var status = Enum.Parse<ParticipantStatus>(participant.CurrentStatus.ToString());
        var role = Enum.Parse<Role>(participant.UserRole.ToString());
        
        var response = new ParticipantResponseVho
        {
            Id = participant.Id,
            Status = status,
            Role = role,
            DisplayName = participant.DisplayName,
            CurrentRoom = RoomSummaryResponseMapper.Map(participant.CurrentRoom),
            InterpreterRoom = RoomSummaryResponseMapper.Map(participant.CurrentInterpreterRoom),
            LinkedParticipants = participant.LinkedParticipants.Select(lp => new LinkedParticipantResponse
            {
                LinkedId = lp.LinkedId,
                LinkType = (LinkType)lp.Type
            }).ToList()
        };
        
        if (role == Role.Judge)
        {
            response.TiledDisplayName = $"T{0};{participant.DisplayName};{participant.Id}";
        }
        
        return response;
    }
}
