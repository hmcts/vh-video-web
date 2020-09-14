namespace VideoWeb.AcceptanceTests.Configuration
{
    public class VideoWebVhServicesConfig
    {
        public bool RunningTestApiLocally { get; set; }
        public bool RunningVideoWebLocally { get; set; }
        public string TestApiUrl { get; set; }
        public string TestApiResourceId { get; set; }
        public string VideoWebApiUrl { get; set; }
        public string VideoWebUrl { get; set; }
    }
}
