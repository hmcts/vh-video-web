namespace VideoWeb.Common.Configuration
{
    public class AzureAdConfiguration : IdpConfiguration
    {
        public string ClientSecret { get; set; }
        public ApplicationInsightsConfiguration ApplicationInsights { get; set; }
    }
}
