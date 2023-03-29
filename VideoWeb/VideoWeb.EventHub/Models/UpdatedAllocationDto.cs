using System;
using VideoWeb.EventHub.InternalHandlers.Core;

namespace VideoWeb.EventHub.Models
{
    public class UpdatedAllocationDto : IInternalEventPayload
    {
        public Guid ConferenceId { get; set; }
        public DateTime ScheduledDateTime { get; set; }
        public string CaseName { get; set; }
        public string JudgeDisplayName { get; set; }
    }
}
