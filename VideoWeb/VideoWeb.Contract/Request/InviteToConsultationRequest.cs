using System;

namespace VideoWeb.Contract.Request
{
    public class InviteToConsultationRequest
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
        /// The id of the participant you would like to invite into the consultation
        /// </summary>
        public Guid ParticipantId { get; set; }
    }
}
