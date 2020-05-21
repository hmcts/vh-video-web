using AcceptanceTests.Common.Configuration;
using VideoWeb.Common.Security.HashGen;

namespace VideoWeb.AcceptanceTests.Configuration
{
    public class VideoWebConfig
    {
        public VideoWebSecurityConfiguration AzureAdConfiguration { get; set; }
        public KinlyConfiguration VideoWebKinlyConfiguration { get; set; }
        public VideoWebTestConfig TestConfig { get; set; }
        public VideoWebVhServicesConfig VhServices { get; set; }
        public SauceLabsSettingsConfig SauceLabsConfiguration { get; set; }
        public WowzaConfiguration Wowza { get; set; }
    }
}
