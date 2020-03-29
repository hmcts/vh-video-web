using System;
using System.Collections.Generic;
using VideoWeb.Common.Models;

namespace VideoWeb.Contract.Responses
{
    public class ConferenceForJudgeResponse
    {
        /// <summary>
        /// Conference UUID
        /// </summary>
        public Guid Id { get; set; }
        
        /// <summary>
        /// Scheduled date time as UTC
        /// </summary>
        public DateTime ScheduledDateTime { get; set; }
        
        /// <summary>
        /// The scheduled duration in minutes
        /// </summary>
        public int ScheduledDuration { get; set; }
        
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
        /// The current conference status
        /// </summary>
        public ConferenceStatus Status { get; set; }
        
        /// <summary>
        /// The conference participants
        /// </summary>
        public List<ParticipantForJudgeResponse> Participants { get; set; }
    }

    public class ParticipantForJudgeResponse
    {
        /// <summary>
        /// The participant display name during a conference
        /// </summary>
        public string DisplayName { get; set; }
        
        /// <summary>
        /// The participant role in conference
        /// </summary>
        public Role Role { get; set; }
        
        /// <summary>
        /// The representee (if participant is a representative)
        /// </summary>
        public string Representee { get; set; }
        
        /// <summary>
        /// The group a participant belongs to
        /// </summary>
        public string CaseTypeGroup { get; set; }
    }
}
