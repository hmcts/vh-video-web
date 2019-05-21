using System;
using VideoWeb.Services.Video;

namespace VideoWeb.Contract.Request
{
    public class AddMediaEventRequest
    {
        public Guid ParticipantId { get; set; }
        public EventType EventType => EventType.MediaPermissionDenied;
    }
}