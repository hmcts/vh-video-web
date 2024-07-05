using System;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Responses;
using ParticipantResponse = VideoApi.Contract.Responses.ParticipantResponse;
using ParticipantStatus = VideoWeb.Common.Models.ParticipantStatus;

namespace VideoWeb.Mappings;

public class ParticipantResponseForVhoMapper(IMapTo<RoomResponse, RoomSummaryResponse> roomResponseMapper) : IMapTo<ParticipantResponse, ParticipantResponseVho>
{
    public ParticipantResponseVho Map(ParticipantResponse participant)
    {
        var status = Enum.Parse<ParticipantStatus>(participant.CurrentStatus.ToString());
        var role = Enum.Parse<Role>(participant.UserRole.ToString());
        
        var response = new ParticipantResponseVho
        {
            Id = participant.Id,
            Status = status,
            Role = role,
            DisplayName = participant.DisplayName,
            CurrentRoom = roomResponseMapper.Map(participant.CurrentRoom),
            InterpreterRoom = roomResponseMapper.Map(participant.CurrentInterpreterRoom),
            LinkedParticipants = participant.LinkedParticipants.Select(lp => new Contract.Responses.LinkedParticipantResponse
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
