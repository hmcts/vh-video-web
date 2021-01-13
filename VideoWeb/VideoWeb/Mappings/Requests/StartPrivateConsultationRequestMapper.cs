using VideoWeb.Contract.Request;

namespace VideoWeb.Mappings.Requests
{
    public class StartPrivateConsultationRequestMapper : IMapTo<StartPrivateConsultationRequest, StartConsultationRequest>
    {
        public StartConsultationRequest Map(StartPrivateConsultationRequest request)
        {

            return new StartConsultationRequest
            {
                ConferenceId = request.ConferenceId,
                RequestedBy = request.RequestedBy,
                RoomType = request.RoomType,
            };
        }
    }
}
