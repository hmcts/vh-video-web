using VideoWeb.Contract.Request;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Requests;

namespace VideoWeb.Mappings.Requests
{
    public class LockRoomRequestMapper : IMapTo<LockConsultationRoomRequest, LockRoomRequest>
    {
        public LockRoomRequest Map(LockConsultationRoomRequest input)
        {
            return new LockRoomRequest
            {
                ConferenceId = input.ConferenceId,
                Lock = input.Lock,
                RoomLabel = input.RoomLabel
            };
        }
    }
}
