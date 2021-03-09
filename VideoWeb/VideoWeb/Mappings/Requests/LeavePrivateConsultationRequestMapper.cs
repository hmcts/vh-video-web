using VideoWeb.Contract.Request;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Requests;

namespace VideoWeb.Mappings.Requests
{
    public class LeavePrivateConsultationRequestMapper : IMapTo<LeavePrivateConsultationRequest, LeaveConsultationRequest>
    {
        public LeaveConsultationRequest Map(LeavePrivateConsultationRequest request)
        {
            return new LeaveConsultationRequest
            {
                ConferenceId = request.ConferenceId,
                ParticipantId = request.ParticipantId
            };
        }
    }
}
