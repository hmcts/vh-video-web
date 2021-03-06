using System;
using VideoWeb.Contract.Request;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Requests;

namespace VideoWeb.Mappings.Requests
{
    public class StartPrivateConsultationRequestMapper : IMapTo<StartPrivateConsultationRequest, StartConsultationRequest>
    {
        public StartConsultationRequest Map(StartPrivateConsultationRequest request)
        {

            return new StartConsultationRequest
            {
                Conference_id = request.ConferenceId,
                Requested_by = request.RequestedBy,
                Room_type = Enum.Parse<VirtualCourtRoomType>(request.RoomType.ToString())
            };
        }
    }
}
