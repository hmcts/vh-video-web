using VideoWeb.Contract.Request;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings.Requests
{
    public static class LeavePrivateConsultationRequestMapper {
        public static LeaveConsultationRequest MapToLeaveConsultationRequest(LeavePrivateConsultationRequest request)
        {
            return new LeaveConsultationRequest
            {
                Conference_id = request.ConferenceId,
                Participant_id = request.ParticipantId
            };
        }
    }
}
