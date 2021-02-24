namespace VideoWeb.Common.Models
{
    public enum ConsultationAnswer
    {
        /// <summary>
        /// Default when no answer has been provided
        /// </summary>
        None,
        /// <summary>
        /// Accept a consultation request
        /// </summary>
        Accepted,
        /// <summary>
        /// Reject a consultation request
        /// </summary>
        Rejected,
        /// <summary>
        /// Consultation request failed
        /// </summary>
        Failed,
        /// <summary>
        /// Transferring to the consultation
        /// </summary>
        Transferring
    }
}
