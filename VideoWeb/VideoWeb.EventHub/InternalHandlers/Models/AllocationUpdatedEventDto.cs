using System.Collections.Generic;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.InternalHandlers.Core;

namespace VideoWeb.EventHub.InternalHandlers.Models
{
    public class AllocationUpdatedEventDto : IInternalEventPayload
    {
        public string CsoUsername { get; set; }
        public List<Conference> Conferences { get; set; }
    }
}
