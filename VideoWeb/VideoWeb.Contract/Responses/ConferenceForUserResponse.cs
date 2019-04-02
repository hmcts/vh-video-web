using System;

namespace VideoWeb.Contract.Responses
{
    /// <summary>
    /// High level summary of a conference for a user
    /// </summary>
    public class ConferenceForUserResponse
    {
        /// <summary>
        /// Conference ID
        /// </summary>
        public Guid Id { get; set; }
        
        /// <summary>
        /// Scheduled date time as UTC
        /// </summary>
        public DateTime ScheduledDateTime { get; set; }
        
        /// <summary>
        /// The case type
        /// </summary>
        public string CaseType { get; set; }
        
        /// <summary>
        /// The case number
        /// </summary>
        public string CaseNumber { get; set; }
        
        /// <summary>
        /// The case name
        /// </summary>
        public string CaseName { get; set; }
    }
}