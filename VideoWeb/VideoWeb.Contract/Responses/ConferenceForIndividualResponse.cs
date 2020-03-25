using System;

namespace VideoWeb.Contract.Responses
{
    public class ConferenceForIndividualResponse
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
        /// The case number
        /// </summary>
        public string CaseNumber { get; set; }
        
        /// <summary>
        /// The case name
        /// </summary>
        public string CaseName { get; set; }
        
        /// <summary>
        /// This is the id of the participant logged in
        /// </summary>
        /// <returns>Participant UUID</returns>
        public Guid LoggedInParticipantId { get; set; }
        
        /// <summary>
        /// This is the id of the participant logged in
        /// </summary>
        /// <returns>Participant UUID</returns>
        public string LoggedInParticipantDisplayName { get; set; }
    }
}
