using Microsoft.Extensions.Configuration;

namespace VideoWeb.AcceptanceTests.Configuration
{
    public class TestConfigSettings
    {

        public string VhOfficerUsername { get; set; }
        public string VhOfficerFinRemedy { get; set; }
        public string VhOfficerCivilMoneyclaims { get; set; }
        public string VhOfficerFinRemedyCivilMoneyclaims { get; set; }
        public string CaseAdminFinRemedy { get; set; }
        public string CaseAdminCivilMoneyClaims { get; set; }
        public string CaseAdminFinRemedyCivilMoneyClaims { get; set; }
        public string NonAdmin { get; set; }
        public string UserPassword { get; set; }
        public string WebsiteUrl { get; set; }

        public static TestConfigSettings GetSettings(string userSecretsKey = "f99a3fe8-cf72-486a-b90f-b65c27da84ee")
        {
            var config = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json", false, true)
                .AddUserSecrets(userSecretsKey)
                .AddEnvironmentVariables()
                .Build();

            var settings = new TestConfigSettings();
            config.GetSection("TestUserSecrets").Bind(settings);
            config.Bind(settings);

            return settings;
        }
    }
}
