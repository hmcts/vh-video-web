using System;
using VideoWeb.Contract.Request;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings.Requests
{
    public class PrivateAdminConsultationRequestMapper : IMapTo<AdminConsultationRequest, PrivateAdminConsultationRequest>
    {
        public AdminConsultationRequest Map(PrivateAdminConsultationRequest request)
        {
            ConsultationAnswer? answer =  Enum.Parse<ConsultationAnswer>(request.Answer.ToString());
            RoomType room = Enum.Parse<RoomType>(request.ConsultationRoom.ToString());
            return new AdminConsultationRequest
            {
                Conference_id = request.ConferenceId,
                Participant_id = request.ParticipantId,
                Consultation_room = room,
                Answer = answer
            };
        }
    }
}
