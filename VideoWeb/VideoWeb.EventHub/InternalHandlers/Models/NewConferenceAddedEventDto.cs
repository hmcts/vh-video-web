using System;
using VideoWeb.EventHub.InternalHandlers.Core;

namespace VideoWeb.EventHub.InternalHandlers.Models
{
    public class NewConferenceAddedEventDto : IInternalEventPayload
    {
        public Guid ConferenceId { get; set; }
    }
}
