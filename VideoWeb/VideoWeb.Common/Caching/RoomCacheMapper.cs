using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Caching;

public static class RoomCacheMapper
{
    public static ParticipantMeetingRoom Map(RoomResponse roomResponse)
    {
        if(roomResponse == null)
            return null;
        
        return new ParticipantMeetingRoom
        {
            Id = roomResponse.Id,
            Label = roomResponse.Label,
            Locked = roomResponse.Locked
        };
    }
}
