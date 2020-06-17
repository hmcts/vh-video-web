using System;
using VideoWeb.Contract.Request;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings.Requests
{
    public static class PrivateConsultationRequestMapper
    {
        public static ConsultationRequest MapToApiConsultationRequest(PrivateConsultationRequest request)
        {
            ConsultationAnswer? answer = null;
            if (request.Answer.HasValue)
            {
                answer = Enum.Parse<ConsultationAnswer>(request.Answer.ToString()!);
            }

            return new ConsultationRequest
            {
                Conference_id = request.ConferenceId,
                Requested_by = request.RequestedById,
                Requested_for = request.RequestedForId,
                Answer = answer
            };
        }
    }
}
