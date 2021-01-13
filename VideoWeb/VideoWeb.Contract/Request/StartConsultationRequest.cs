using System;
using VideoWeb.Contract.Enums;

namespace VideoWeb.Contract.Request
{
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
