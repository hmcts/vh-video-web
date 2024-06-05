using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Caching;

public static class RoomCacheMapper
{
    public static MeetingRoomDto Map(RoomResponse roomResponse)
    {
        if(roomResponse == null)
            return null;
        
        return new MeetingRoomDto
        {
            Id = roomResponse.Id,
            Label = roomResponse.Label,
            Locked = roomResponse.Locked
        };
    }
}
