using System;
using VideoWeb.Contract.Request;
using VideoApi.Contract.Requests;

namespace VideoWeb.Mappings.Requests;

public static class PrivateConsultationRequestMapper
{
    public static ConsultationRequestResponse Map(PrivateConsultationRequest request)
    {
        var answer = Enum.Parse<ConsultationAnswer>(request.Answer.ToString());
        
        return new ConsultationRequestResponse
        {
            ConferenceId = request.ConferenceId,
            RequestedBy = request.RequestedById,
            RequestedFor = request.RequestedForId,
            RoomLabel = request.RoomLabel,
            Answer = answer
        };
    }
}
