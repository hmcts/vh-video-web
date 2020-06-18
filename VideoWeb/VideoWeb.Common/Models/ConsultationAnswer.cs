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
        /// Cancel a consultation request
        /// </summary>
        Cancelled,
        /// <summary>
        /// Consultation request failed
        /// </summary>
        Failed,
        /// <summary>
        /// No consultation rooms available
        /// </summary>
        NoRoomsAvailable
    }
}
