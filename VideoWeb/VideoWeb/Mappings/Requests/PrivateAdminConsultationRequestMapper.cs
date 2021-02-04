using System;
using VideoApi.Contract.Requests;
using VideoWeb.Contract.Request;

namespace VideoWeb.Mappings.Requests
{
    public class PrivateAdminConsultationRequestMapper : IMapTo<PrivateAdminConsultationRequest, AdminConsultationRequest>
    {
        public AdminConsultationRequest Map(PrivateAdminConsultationRequest request)
        {
            ConsultationAnswer? answer =  Enum.Parse<ConsultationAnswer>(request.Answer.ToString());
            RoomType room = Enum.Parse<RoomType>(request.ConsultationRoom.ToString());
            return new AdminConsultationRequest
            {
                ConferenceId = request.ConferenceId,
                ParticipantId = request.ParticipantId,
                ConsultationRoom = room,
                Answer = answer
            };
        }
    }
}
