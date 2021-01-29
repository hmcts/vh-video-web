using System;

namespace VideoWeb.Contract.Responses
{
    public class UnreadAdminMessageResponse
    {
        public string ParticipantUsername { get; set; }
        public int NumberOfUnreadMessages { get; set; }
        public Guid ParticipantId { get; set; }

    }
}
