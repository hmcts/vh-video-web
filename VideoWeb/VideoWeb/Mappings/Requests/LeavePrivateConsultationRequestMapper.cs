using VideoWeb.Contract.Request;
using VideoApi.Contract.Requests;

namespace VideoWeb.Mappings.Requests;

public static class LeavePrivateConsultationRequestMapper
{
    public static LeaveConsultationRequest Map(LeavePrivateConsultationRequest request)
    {
        return new LeaveConsultationRequest
        {
            ConferenceId = request.ConferenceId,
            ParticipantId = request.ParticipantId
        };
    }
}
