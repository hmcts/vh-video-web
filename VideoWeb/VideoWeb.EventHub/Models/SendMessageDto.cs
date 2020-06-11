using System;
using VideoWeb.Common.Models;

namespace VideoWeb.EventHub.Models
{
    public class SendMessageDto
    {
        public Guid MessageUuid { get; set; }
        public Conference Conference { get; set; }
        public string Message { get; set; }
        public string From { get; set; }
        public string To { get; set; }
        public string ParticipantUsername { get; set; }
        public DateTime Timestamp { get; set; }

    }
}
