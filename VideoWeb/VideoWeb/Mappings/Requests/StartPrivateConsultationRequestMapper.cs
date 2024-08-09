using System;
using VideoWeb.Contract.Request;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Enums;

namespace VideoWeb.Mappings.Requests;

public static class StartPrivateConsultationRequestMapper
{
    public static StartConsultationRequest Map(StartPrivateConsultationRequest request)
    {
        return new StartConsultationRequest
        {
            ConferenceId = request.ConferenceId,
            RequestedBy = request.RequestedBy,
            RoomType = Enum.Parse<VirtualCourtRoomType>(request.RoomType.ToString())
        };
    }
}
