using System;
using System.Collections.Generic;
using VideoWeb.Common.Enums;

namespace VideoWeb.Contract.Responses
{
    public class ConferenceForUserResponse
    {
        public Guid Id { get; set; }
        public DateTime ScheduledDateTime { get; set; }
        public string CaseType { get; set; }
        public string CaseNumber { get; set; }
        public string CaseName { get; set; }
        public int? ScheduledDuration { get; set; }
        public ConferenceState? Status { get; set; }
        public List<ParticipantSummaryResponse> Participants { get; set; }
    }
}