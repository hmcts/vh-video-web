using System;
using VideoWeb.Services.Video;

namespace VideoWeb.Controllers
{
    public class AddMediaEventRequest
    {
        public Guid ParticipantId { get; set; }
        public EventType EventType => EventType.MediaPermissionDenied;
    }
}