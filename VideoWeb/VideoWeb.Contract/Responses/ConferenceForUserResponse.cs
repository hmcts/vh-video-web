using System;
using System.Collections.Generic;

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
        
        /// <summary>
        /// The scheduled duration in minutes
        /// </summary>
        public int ScheduledDuration { get; set; }
        
        /// <summary>
        /// The current conference status
        /// </summary>
        public ConferenceStatus Status { get; set; }
        
        /// <summary>
        /// The conference participants
        /// </summary>
        public List<ParticipantForUserResponse> Participants { get; set; }
        
        /// <summary>
        /// The number of participants available
        /// </summary>
        public int NoOfParticipantsAvailable { get; set; }
        
        /// <summary>
        /// The number of participants unavailable
        /// </summary>
        public int NoOfParticipantsUnavailable { get; set; }
        
        /// <summary>
        /// The number of participants in consultation
        /// </summary>
        public int NoOfParticipantsInConsultation { get; set; }
    }
}