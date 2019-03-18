using System;

namespace VideoWeb.Contract.Responses
{
    public class ConferenceForUserResponse
    {
        public Guid Id { get; set; }
        public DateTime ScheduledDateTime { get; set; }
        public string CaseType { get; set; }
        public string CaseNumber { get; set; }
        public string CaseName { get; set; }
    }
}