using AcceptanceTests.Common.Configuration;

namespace VideoWeb.AcceptanceTests.Configuration
{
    public class VideoWebConfig
    {
        public VideoWebSecurityConfiguration AzureAdConfiguration { get; set; }
        public VideoWebCustomToken VideoWebCustomToken { get; set; }
        public VideoWebTestConfig TestConfig { get; set; }
        public VideoWebVhServicesConfig VhServices { get; set; }
        public SauceLabsSettingsConfig SauceLabsConfiguration { get; set; }
    }
}
