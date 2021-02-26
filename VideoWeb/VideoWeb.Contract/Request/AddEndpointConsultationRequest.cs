using System;

namespace VideoWeb.Contract.Request
{
    public class AddEndpointConsultationRequest
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
        /// The id of the endpoint you would like to invite into the consultation
        /// </summary>
        public Guid EndpointId { get; set; }
    }
}
