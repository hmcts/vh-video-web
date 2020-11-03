using VideoWeb.Services.Video;

namespace VideoWeb.Contract.Request
{
    public class SelectingDeviceMedia
    {
        public EventType EventType => EventType.SelectingMedia;

        public bool HasMultipleDevices { get; set; }

        public string Camera { get; set; }

        public string Mic { get; set; }

        public string Reason { get; set; }
    }
}
