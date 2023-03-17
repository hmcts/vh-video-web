using System;

namespace VideoWeb.EventHub.Models
{
    public class UpdatedAllocationDto
    {
        public Guid ConferenceId { get; set; }
        public DateTime ScheduledDateTime { get; set; }
        public string CaseName { get; set; }
        public string JudgeDisplayName { get; set; }
    }
}
