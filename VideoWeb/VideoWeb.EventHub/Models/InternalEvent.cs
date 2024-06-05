using System;
using System.Collections.Generic;
using System.Text;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Enums;

namespace VideoWeb.EventHub.Models
{
    public class InternalEvent
    {
        public Guid ConferenceId { get; set; }
        public EventType EventType { get; set; }
        public IEnumerable<ParticipantDto> ParticipantsAdded { get; set; }
    }
}
