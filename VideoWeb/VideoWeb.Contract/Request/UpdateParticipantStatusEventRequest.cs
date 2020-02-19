using System;
using VideoWeb.Services.Video;

namespace VideoWeb.Contract.Request
{
    public class UpdateParticipantStatusEventRequest
    {
        public Guid ParticipantId { get; set; }
        public EventType EventType { get; set; }
    }
}
