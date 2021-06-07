using VideoApi.Contract.Requests;
using VideoWeb.Contract.Request;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class JoinPrivateConsultationRequestMapper : IMapTo<JoinPrivateConsultationRequest, ConsultationRequestResponse>
    {
        public ConsultationRequestResponse Map(JoinPrivateConsultationRequest request)
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
}
