using System;
using System.Collections.Generic;
using VideoWeb.Common.Enums;
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
        /// Has the countdown completed
        /// </summary>
        public bool CountdownCompleted { get; set; }
        
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

        /// <summary>
        /// The video access endpoints in the conference
        /// </summary>
        public List<VideoEndpointResponse> Endpoints { get; set; }

        /// <summary>
        /// Flags true when hearing venue is in Scotland
        /// </summary>
        public bool HearingVenueIsScottish { get; set; }

        /// <summary>
        /// Property to indicate whether wowza recording is via single app setup or bespoke hearing setup
        /// </summary>
        public string IngestUrl { get; set; }

        /// <summary>
        /// The supplier that the conference is booked with
        /// </summary>
        public Supplier Supplier { get; set; }
        
        /// <summary>
        /// Allocated Cso Full name
        /// </summary>
        public string AllocatedCso { get; set; }

        /// <summary>
        /// Allocated Cso Id
        /// </summary>
        public Guid? AllocatedCsoId { get; set; }

        /// <summary>
        /// Allocated Cso Username
        /// </summary>
        public string AllocatedCsoUsername { get; set; }
    }
}
