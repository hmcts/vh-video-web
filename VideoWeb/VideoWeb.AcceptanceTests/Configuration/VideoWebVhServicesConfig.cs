namespace VideoWeb.AcceptanceTests.Configuration
{
    public class VideoWebVhServicesConfig
    {
        public bool RunningVideoApiLocally { get; set; }
        public bool RunningVideoWebLocally { get; set; }
        public string BookingsApiUrl { get; set; }
        public string BookingsApiResourceId { get; set; }
        public string UserApiUrl { get; set; }
        public string UserApiResourceId { get; set; }
        public string VideoApiUrl { get; set; }
        public string VideoApiResourceId { get; set; }
        public string VideoWebUrl { get; set; }
        public string VideoWebResourceId { get; set; }
    }
}
