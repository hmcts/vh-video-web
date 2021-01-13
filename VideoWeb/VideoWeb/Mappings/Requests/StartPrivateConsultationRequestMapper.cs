using System;
using VideoWeb.Contract.Enums;
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

    // TODO REMOVE
    public class StartConsultationRequest
    {
        /// <summary>
        /// The conference UUID
        /// </summary>
        public Guid ConferenceId { get; set; }

        /// <summary>
        /// The room type number
        /// </summary>
        public VirtualCourtRoomType RoomType { get; set; }

        /// <summary>
        /// Requester's UUID
        /// </summary>
        public Guid RequestedBy { get; set; }
    }
}
