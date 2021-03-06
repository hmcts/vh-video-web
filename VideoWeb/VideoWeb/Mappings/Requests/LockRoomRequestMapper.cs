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
                Conference_id = input.ConferenceId,
                Lock = input.Lock,
                Room_label = input.RoomLabel
            };
        }
    }
}
