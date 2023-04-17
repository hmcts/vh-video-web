namespace VideoWeb.Common.Configuration
{
    public class AzureAdConfiguration : IdpConfiguration
    {
        public override string ConfigId => "vhaad";
        public string ClientSecret { get; set; }
        public ApplicationInsightsConfiguration ApplicationInsights { get; set; }
    }
}
