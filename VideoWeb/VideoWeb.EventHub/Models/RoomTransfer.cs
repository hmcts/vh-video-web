using System;

namespace VideoWeb.EventHub.Models
{
    public class RoomTransfer
    {
        public  Guid ParticipantId { get; set; }
        public string FromRoom { get; set; }
        public string ToRoom { get; set; }
    }
}
