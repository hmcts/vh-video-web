using System;
using System.Collections.Generic;

namespace VideoWeb.Contract.Responses
{
    public class ConferenceResponse
    {
        public Guid Id { get; set; }
        public DateTime ScheduledDateTime { get; set; }
        public string CaseType { get; set; }
        public string CaseNumber { get; set; }
        public string CaseName { get; set; }
        public ConferenceStatus Status { get; set; }
        public List<ParticipantResponse> Participants { get; set; }
    }
}