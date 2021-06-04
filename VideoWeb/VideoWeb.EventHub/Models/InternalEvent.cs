using System;
using System.Collections.Generic;
using System.Text;
using VideoApi.Contract.Requests;
using VideoWeb.EventHub.Enums;

namespace VideoWeb.EventHub.Models
{
    public class InternalEvent
    {
        public DateTime TimeStampUtc { get; set; }
        public Guid ConferenceId { get; set; }
        public EventType EventType { get; set; }
        public AddParticipantsToConferenceRequest AddParticipantsToConferenceRequest { get; set; }
    }
}
