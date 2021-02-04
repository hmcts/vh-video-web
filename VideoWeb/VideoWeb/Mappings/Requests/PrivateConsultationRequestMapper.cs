using System;
using VideoApi.Contract.Requests;
using VideoWeb.Contract.Request;

namespace VideoWeb.Mappings.Requests
{
    public class PrivateConsultationRequestMapper : IMapTo<PrivateConsultationRequest, ConsultationRequest>
    {
        public ConsultationRequest Map(PrivateConsultationRequest request)
        {
            ConsultationAnswer? answer = null;
            if (request.Answer.HasValue)
            {
                answer = Enum.Parse<ConsultationAnswer>(request.Answer.ToString()!);
            }

            return new ConsultationRequest
            {
                ConferenceId = request.ConferenceId,
                RequestedBy = request.RequestedById,
                RequestedFor = request.RequestedForId,
                Answer = answer
            };
        }
    }
}
