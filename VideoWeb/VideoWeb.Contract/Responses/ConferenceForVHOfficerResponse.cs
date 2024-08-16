using System;
using System.Collections.Generic;
using VideoWeb.Common.Enums;
using VideoWeb.Common.Models;

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
        /// The name of the hearing venue
        /// </summary>
        public string HearingVenueName { get; set; }

        /// <summary>
        /// Started date time as UTC
        /// </summary>
        public DateTime? StartedDateTime { get; set; }

        /// <summary>
        /// Closed date time as UTC
        /// </summary>
        public DateTime? ClosedDateTime { get; set; }

        /// <summary>
        /// The telephone Id of the conference
        /// </summary>
        public string TelephoneConferenceId { get; set; }

        /// <summary>
        /// The telephone conference number to dial
        /// </summary>
        public string TelephoneConferenceNumbers { get; set; }
        /// <summary>
        /// Created date time as UTC
        /// </summary>
        public DateTime? CreatedDateTime { get; set; }

        /// <summary>
        /// Hearing Id for the vh-booking database
        /// </summary>
        public Guid HearingRefId { get; set; }

        /// <summary>
        /// Allocated Cso Full name
        /// </summary>
        public string AllocatedCso { get; set; }

        /// <summary>
        /// Allocated Cso Id
        /// </summary>
        public Guid? AllocatedCsoId { get; set; }
        
        /// <summary>
        /// The supplier that the conference is booked with
        /// </summary>
        public Supplier Supplier { get; set; }
    }
}
