using System;

namespace VideoWeb.Contract.Request
{
    public class JudgeJohEndConsultationRequest
    { 
        public Guid ConferenceId { get; set; }
        public long RoomId { get; set; }
        public Guid RequestedBy { get; set; }
    }
}
