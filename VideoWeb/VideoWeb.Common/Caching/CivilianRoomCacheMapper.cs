using VideoWeb.Common.Models;
using VideoApi.Contract.Responses;

namespace VideoWeb.Common.Caching
{
    public static class CivilianRoomCacheMapper
    {
        public static CivilianRoomDto MapCivilianRoomToCacheModel(CivilianRoomResponse civilianRoom)
        {
            return new CivilianRoomDto
            {
                Id = civilianRoom.Id,
                RoomLabel = civilianRoom.Label,
                Participants = civilianRoom.Participants
            };
        }
    }
}
