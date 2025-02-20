namespace VideoWeb.Common.Configuration
{
    public class HearingServicesConfiguration
    {
        public string BookingsApiUrl { get; set; }
        public string BookingsApiResourceId { get; set; }
        public string VideoApiUrl { get; set; }
        public string VideoApiResourceId { get; set; }
        public string VideoWebUrl { get; set; }
        public string VideoWebResourceId { get; set; }
        public string UserApiUrl { get; set; }
        public string UserApiResourceId { get; set; }
        public string EventHubPath { get; set; }
        public string EmailReformDomain { get; set; }
        public string InternalEventSecret { get; set; }
        public bool EnableVideoFilters { get; set; }
        public bool EnableAndroidSupport { get; set; }
        public bool EnableIOSMobileSupport { get; set; }
        public bool EnableIOSTabletSupport { get; set; }
        public int BlurRadius { get; set; }
        public string LaunchDarklyClientId { get; set; }
    }
}
