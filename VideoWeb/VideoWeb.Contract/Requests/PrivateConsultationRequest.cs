using System;

namespace VideoWeb.Contract.Requests
{
    public class PrivateConsultationRequest
    {
        /// <summary>
        ///     The id of the participant the requester requesting a consultation
        /// </summary>
        public Guid RequestBy { get; set; }

        /// <summary>
        ///     The id of the participant being requested for a consultation
        /// </summary>
        public Guid RequestFor { get; set; }

        /// <summary>
        ///     The UUID of the virtual courtroom
        /// </summary>
        public Guid ConferenceId { get; set; }
    }
}