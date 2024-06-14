using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Caching;

public static class RoomCacheMapper
{
    public static MeetingRoom Map(RoomResponse roomResponse)
    {
        if(roomResponse == null)
            return null;
        
        return new MeetingRoom
        {
            Id = roomResponse.Id,
            Label = roomResponse.Label,
            Locked = roomResponse.Locked
        };
    }
}
