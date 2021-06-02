using System;
using System.Collections.Generic;
using System.Text;
using VideoWeb.EventHub.Enums;

namespace VideoWeb.EventHub.Models
{
    public class InternalEvent
    {
        public DateTime TimeStampUtc { get; set; }
        public Guid ConferenceId { get; set; }
        public Guid ParticipantId { get; set; }
        public EventType EventType { get; set; }
    }
}
