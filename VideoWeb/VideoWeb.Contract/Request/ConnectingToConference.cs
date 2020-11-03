using VideoWeb.Services.Video;

namespace VideoWeb.Contract.Request
{
    public class ConnectingToConference
    {
        public EventType EventType => EventType.ConnectingToConference;

        public string Reason { get; set; }
    }
}
