namespace VideoWeb.Common.Configuration
{
    public class MagicLinksConfiguration : IdpConfiguration
    {
        public string JwtProviderSecret { get; set; }

        public string Issuer => $"{Authority}{TenantId}";

        public ApplicationInsightsConfiguration ApplicationInsights { get; set; }
    }
}
