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
        public int? ScheduledDuration { get; set; }
        public ConferenceStatus Status { get; set; }
        public List<ParticipantForUserResponse> Participants { get; set; }
        public int NoOfParticipantsAvailable { get; set; }
        public int NoOfParticipantsUnavailable { get; set; }
        public int NoOfParticipantsInConsultation { get; set; }
    }
}