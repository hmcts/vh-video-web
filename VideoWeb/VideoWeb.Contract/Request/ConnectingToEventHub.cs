using VideoWeb.Services.Video;

namespace VideoWeb.Contract.Request
{
    public class ConnectingToEventHub
    {
        public EventType EventType => EventType.ConnectingToEventHub;

        public string Reason { get; set; }
    }
}
