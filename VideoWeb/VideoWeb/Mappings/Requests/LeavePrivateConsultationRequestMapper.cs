using VideoWeb.Contract.Request;
using VideoWeb.Mappings.Interfaces;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings.Requests
{
    public class LeavePrivateConsultationRequestMapper : IMapTo<LeavePrivateConsultationRequest, LeaveConsultationRequest>
    {
        public LeaveConsultationRequest Map(LeavePrivateConsultationRequest request)
        {
            return new LeaveConsultationRequest
            {
                Conference_id = request.ConferenceId,
                Participant_id = request.ParticipantId
            };
        }
    }
}
