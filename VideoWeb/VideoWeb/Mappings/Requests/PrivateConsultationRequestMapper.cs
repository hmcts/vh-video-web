using System;
using VideoWeb.Contract.Request;
using VideoWeb.Mappings.Interfaces;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings.Requests
{
    public class PrivateConsultationRequestMapper : IMapTo<PrivateConsultationRequest, ConsultationRequestResponse>
    {
        public ConsultationRequestResponse Map(PrivateConsultationRequest request)
        {
            var answer = Enum.Parse<ConsultationAnswer>(request.Answer.ToString());

            return new ConsultationRequestResponse
            {
                Conference_id = request.ConferenceId,
                Requested_by = request.RequestedById,
                Requested_for = request.RequestedForId,
                Room_label = request.RoomLabel,
                Answer = answer
            };
        }
    }
}
