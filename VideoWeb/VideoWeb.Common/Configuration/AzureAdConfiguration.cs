namespace VideoWeb.Common.Configuration
{
    public class AzureAdConfiguration
    {
        public string ClientId { get; set; }
        public string ClientSecret { get; set; }
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