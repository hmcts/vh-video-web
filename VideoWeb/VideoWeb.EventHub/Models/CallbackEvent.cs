using System;
using System.Collections.Generic;
using VideoApi.Contract.Enums;
using VideoWeb.Common.Models;
using EventType = VideoWeb.EventHub.Enums.EventType;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Enums;

namespace VideoWeb.EventHub.Models
{
    public class CallbackEvent
    {
        public string EventId { get; set; }
        public EventType EventType { get; set; }
        public DateTime TimeStampUtc { get; set; }
        public Guid ConferenceId { get; set; }
        public Guid ParticipantId { get; set; }

        public string TransferFrom { get; set; }

        public string TransferTo { get; set; }

        public string Reason { get; set; }
        public bool IsParticipantInVmr { get; set; }
        public ConferenceState ConferenceStatus { get; set; }
        public bool IsOtherParticipantsInConsultationRoom { get; set; }

        public Participant ParticipantAdded { get; set; }
    }
}
