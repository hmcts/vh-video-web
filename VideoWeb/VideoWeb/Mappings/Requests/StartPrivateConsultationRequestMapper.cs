using System;
using VideoWeb.Contract.Request;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Enums;

namespace VideoWeb.Mappings.Requests
{
    public class StartPrivateConsultationRequestMapper : IMapTo<StartPrivateConsultationRequest, StartConsultationRequest>
    {
        public StartConsultationRequest Map(StartPrivateConsultationRequest request)
        {

            return new StartConsultationRequest
            {
                ConferenceId = request.ConferenceId,
                RequestedBy = request.RequestedBy,
                RoomType = Enum.Parse<VirtualCourtRoomType>(request.RoomType.ToString())
            };
        }
    }
}
