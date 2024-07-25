using System;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;
using ParticipantResponse = VideoApi.Contract.Responses.ParticipantResponse;

namespace VideoWeb.Mappings;

public static class ParticipantUserResponseMapper
{
    /// <summary>
    /// Mapped from DTO to response
    /// </summary>
    /// <param name="participant"></param>
    /// <returns></returns>
    public static ParticipantForUserResponse Map(Participant participant)
    {
        var userResponse = new ParticipantForUserResponse();
        userResponse.Id = participant.Id;
        userResponse.DisplayName = participant.DisplayName;
        userResponse.Status = Enum.Parse<ParticipantStatus>(participant.ParticipantStatus.ToString());
        userResponse.Role = participant.Role;
        userResponse.CurrentRoom = RoomSummaryResponseMapper.Map(participant.CurrentRoom);
        userResponse.InterpreterRoom = RoomSummaryResponseMapper.Map(participant.InterpreterRoom);
        userResponse.LinkedParticipants = participant.LinkedParticipants.Select(LinkedParticipantResponseMapper.Map).ToList();
        ParticipantTilePositionHelper.GetTiledDisplayName(userResponse);
        
        return userResponse;
    }
    
    /// <summary>
    /// Mapped from video-api response to response
    /// </summary>
    /// <param name="participant"></param>
    /// <returns></returns>
    public static ParticipantForUserResponse Map(ParticipantResponse participant)
    {
        var userResponse = new ParticipantForUserResponse();
        userResponse.Id = participant.Id;
        userResponse.DisplayName = participant.DisplayName;
        userResponse.Status =  Enum.Parse<ParticipantStatus>(participant.CurrentStatus.ToString());
        userResponse.Role = Enum.Parse<Role>(participant.UserRole.ToString());
        userResponse.CurrentRoom = RoomSummaryResponseMapper.Map(participant.CurrentRoom);
        userResponse.InterpreterRoom = RoomSummaryResponseMapper.Map(participant.CurrentInterpreterRoom);
        userResponse.LinkedParticipants = participant.LinkedParticipants.Select(LinkedParticipantResponseMapper.Map).ToList();
        ParticipantTilePositionHelper.GetTiledDisplayName(userResponse);
        return userResponse;
    }
}
