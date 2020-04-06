using VideoWeb.Services.Video;

namespace VideoWeb.Contract.Request
{
    public class AddMediaEventRequest
    {
        public EventType EventType => EventType.MediaPermissionDenied;
    }
}
