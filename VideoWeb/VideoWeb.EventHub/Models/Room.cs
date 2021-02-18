using System;

namespace VideoWeb.EventHub.Models
{
    public class Room
    {
        public Guid ConferenceId { get; set; }
        public string Label { get; set; }
        public bool Locked { get; set; }
    }
}
