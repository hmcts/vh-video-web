using System;

namespace VideoWeb.Contract.Request
{
    public class JoinPrivateConsultationRequest
    {
        public Guid ConferenceId { get; set; }
        public Guid ParticipantId { get; set; }
        public string RoomLabel { get; set; }
    }
}
