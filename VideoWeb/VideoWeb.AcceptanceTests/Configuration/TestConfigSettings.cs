using Microsoft.Extensions.Configuration;

namespace VideoWeb.AcceptanceTests.Configuration
{
    public class TestConfigSettings
    {
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
