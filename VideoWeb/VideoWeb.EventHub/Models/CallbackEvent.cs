using System;
using System.Collections.Generic;
using VideoApi.Contract.Enums;
using VideoWeb.Contract.Responses;
using EventType = VideoWeb.EventHub.Enums.EventType;

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

        // public ParticipantsUpdated ParticipantsUpdated { get; set; }
        public List<ParticipantResponse> Participants { get; set; }
    }
}
