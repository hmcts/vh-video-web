using System;
using VideoWeb.EventHub.Enums;

namespace VideoWeb.EventHub.Models
{
    public class CallbackEvent
    {
        public string EventId { get; set; }
        public EventType EventType { get; set; }
        public DateTime TimeStampUtc { get; set; }
        public Guid? ConsultationInvitationId { get; set; }
        public Guid ConferenceId { get; set; }
        public Guid ParticipantId { get; set; }

        public string TransferFrom { get; set; }

        public string TransferTo { get; set; }

        public string Reason { get; set; }
    }
}
