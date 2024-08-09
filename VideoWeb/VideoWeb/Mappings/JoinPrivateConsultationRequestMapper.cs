using VideoApi.Contract.Requests;
using VideoWeb.Contract.Request;

namespace VideoWeb.Mappings;

public static class JoinPrivateConsultationRequestMapper
{
    public static ConsultationRequestResponse Map(JoinPrivateConsultationRequest request)
    {
        return new ConsultationRequestResponse
        {
            ConferenceId = request.ConferenceId,
            RequestedBy = request.ParticipantId,
            RequestedFor = request.ParticipantId,
            RoomLabel = request.RoomLabel,
            Answer = ConsultationAnswer.Accepted
        };
    }
}
