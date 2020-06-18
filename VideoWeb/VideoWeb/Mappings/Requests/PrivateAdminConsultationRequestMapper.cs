using System;
using VideoWeb.Contract.Request;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings.Requests
{
    public static class PrivateAdminConsultationRequestMapper
    {
        public static AdminConsultationRequest MapToAdminConsultationRequest(PrivateAdminConsultationRequest request)
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
