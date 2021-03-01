using VideoWeb.Common.Models;
using VideoWeb.Services.Video;

namespace VideoWeb.Common.Caching
{
    public static class CivilianRoomCacheMapper
    {
        public static CivilianRoom MapCivilianRoomToCacheModel(CivilianRoomResponse civilianRoom)
        {
            return new CivilianRoom
            {
                Id = civilianRoom.Id,
                RoomLabel = civilianRoom.Label,
                Participants = civilianRoom.Participants
            };
        }
    }
}
