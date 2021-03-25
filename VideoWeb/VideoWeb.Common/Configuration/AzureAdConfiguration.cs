using System.Configuration;

namespace VideoWeb.Common.Configuration
{
    public class AzureAdConfiguration
    {
        public string ClientIdV2 { get; set; }
        public string ClientSecretV2 { get; set; }
        public string ClientId => ClientIdV2;
        public string ClientSecret => ClientSecretV2;
        public string Authority { get; set; }
        public string TenantId { get; set; }
        public string RedirectUri { get; set; }
        public string PostLogoutRedirectUri { get; set; }
        public ApplicationInsightsConfiguration ApplicationInsights { get; set; }
    }

    public class ApplicationInsightsConfiguration
    {
        public string InstrumentationKey { get; set; }
    }
}
