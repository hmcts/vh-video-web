using System;
using System.Collections.Generic;
using VideoWeb.Common.Models;

namespace VideoWeb.Contract.Responses
{
    /// <summary>
    /// Detailed information about a conference
    /// </summary>
    public class ConferenceResponse
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
        /// Scheduled duration in minutes
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
        /// The current conference Status
        /// </summary>
        public ConferenceStatus Status { get; set; }
        
        /// <summary>
        /// The uri of the Judge iFrame
        /// </summary>
        public string JudgeIFrameUri { get; set; }
        
        /// <summary>
        /// The participant meeting room uri
        /// </summary>
        public string ParticipantUri { get; set; }
        
        /// <summary>
        /// The pexip node to connect to
        /// </summary>
        public string PexipNodeUri { get; set; }
        
        /// <summary>
        /// The pexip self-test node to connect to
        /// </summary>
        public string PexipSelfTestNodeUri { get; set; }
        
        /// <summary>
        /// The participants in the conference
        /// </summary>
        public List<ParticipantResponse> Participants { get; set; }

        /// <summary>
        /// Closed date time as UTC
        /// </summary>
        public DateTime? ClosedDateTime { get; set; }

        /// <summary>
        /// The name of venue
        /// </summary>
        public string HearingVenueName { get; set; }

        /// <summary>
        /// The options indicated hearing audio recording
        /// </summary>
        public bool AudioRecordingRequired { get; set; }

        /// <summary>
        /// The hearing Id
        /// </summary>
        public Guid HearingRefId { get; set; }
    }
}
