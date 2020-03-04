using System;

namespace VideoWeb.EventHub.Models
{
    public class ParticipantHeartbeat
    {
        public Guid ConferenceId { get; set; }
        public Guid ParticipantId { get; set; }
        public HeartbeatHealth HeartbeatHealth { get; set; }
    }

    public enum HeartbeatHealth
    {
        None = 0, Good, Poor, Bad
    }
}
