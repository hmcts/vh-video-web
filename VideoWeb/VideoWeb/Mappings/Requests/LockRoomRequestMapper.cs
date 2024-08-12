using VideoWeb.Contract.Request;
using VideoApi.Contract.Requests;

namespace VideoWeb.Mappings.Requests;

public static class LockRoomRequestMapper
{
    public static LockRoomRequest Map(LockConsultationRoomRequest input)
    {
        return new LockRoomRequest
        {
            ConferenceId = input.ConferenceId,
            Lock = input.Lock,
            RoomLabel = input.RoomLabel
        };
    }
}
