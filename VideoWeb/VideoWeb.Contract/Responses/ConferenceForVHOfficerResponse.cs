using System;
using System.Collections.Generic;

namespace VideoWeb.Contract.Responses
{
    public class ConferenceForVhOfficerResponse
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
        /// Number of pending tasks for a given hearing
        /// </summary>
        public int NoOfPendingTasks { get; set; }

        /// <summary>
        /// The name of the hearing venue
        /// </summary>
        public string HearingVenueName { get; set; }

        /// <summary>
        /// The conferences tasks
        /// </summary>
        public List<TaskUserResponse> Tasks { get; set; }
        
        /// <summary>
        /// The number of messages since a VHO has answered
        /// </summary>
        public int NumberOfUnreadMessages { get; set; }
    }
}
