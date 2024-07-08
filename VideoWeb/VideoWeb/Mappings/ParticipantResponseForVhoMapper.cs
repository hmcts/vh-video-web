using System;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Responses;
using LinkedParticipantResponse = VideoWeb.Contract.Responses.LinkedParticipantResponse;
using ParticipantResponse = VideoApi.Contract.Responses.ParticipantResponse;
using ParticipantStatus = VideoWeb.Common.Models.ParticipantStatus;

namespace VideoWeb.Mappings;

public class ParticipantResponseForVhoMapper(IMapTo<RoomResponse, RoomSummaryResponse> roomResponseMapper) : IMapTo<ParticipantResponse, ParticipantResponseVho>
{
    public ParticipantResponseVho Map(ParticipantResponse participant)
    {
        var status = Enum.Parse<ParticipantStatus>(participant.CurrentStatus.ToString());
        var role = Enum.Parse<Role>(participant.UserRole.ToString());
        
        var response = new ParticipantResponseVho();
        response.Id = participant.Id;
        response.Status = status;
        response.Role = role;
        response.DisplayName = participant.DisplayName;
        response.CurrentRoom = roomResponseMapper.Map(participant.CurrentRoom);
        response.InterpreterRoom = roomResponseMapper.Map(participant.CurrentInterpreterRoom);
        response.LinkedParticipants = participant.LinkedParticipants.Select(x => new LinkedParticipantResponse
        {
            LinkedId = x.LinkedId,
            LinkType = (LinkType)x.Type
        }).ToList();
        if (role == Role.Judge)
        {
            response.TiledDisplayName = $"T{0};{participant.DisplayName};{participant.Id}";
        }
        
        return response;
    }
}
