using AcceptanceTests.Common.Configuration;

namespace VideoWeb.AcceptanceTests.Configuration
{
    public class VideoWebSecurityConfiguration : IAzureAdConfig
    {
        public string Authority { get; set; }
        public string ClientId { get; set; }
        public string ClientSecret { get; set; }
        public string TenantId { get; set; }
    }
}
