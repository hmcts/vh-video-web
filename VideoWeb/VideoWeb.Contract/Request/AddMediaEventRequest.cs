using VideoApi.Contract.Enums;

namespace VideoWeb.Contract.Request
{
    public class AddMediaEventRequest
    {
        public EventType EventType => EventType.MediaPermissionDenied;
    }
}
