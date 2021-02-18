using System;

namespace VideoWeb.Contract.Request
{
    public class LockConsultationRoomRequest
    {
        /// <summary>
        /// Conference ID
        /// </summary>
        public Guid ConferenceId { get; set; }

        /// <summary>
        /// The room to have a private consultation in
        /// </summary>
        public string RoomLabel { get; set; }

        /// <summary>
        /// The desired lock state of the room
        /// </summary>
        public bool Lock { get; set; }
    }
}
