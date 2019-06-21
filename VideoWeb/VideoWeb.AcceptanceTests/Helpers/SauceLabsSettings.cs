using Microsoft.Extensions.Configuration;

namespace VideoWeb.AcceptanceTests.Helpers
{
    /// <summary>
    /// Wrapper to access environment settings for running tests through RemoteWebDriver to the Saucelabs environment
    /// </summary>
    public class SauceLabsSettings
    {
        public SauceLabsSettings()
        {
            var builder = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json", false, true)
                .AddEnvironmentVariables();

            builder.Build().GetSection("Saucelabs").Bind(this);

            if (RunWithSaucelabs)
            {
                RemoteServerUrl = "http://" + Username + ":" + AccessKey + "@ondemand.eu-central-1.saucelabs.com:80/wd/hub";
            }
        }

        public bool RunWithSaucelabs => !string.IsNullOrEmpty(Username) && !string.IsNullOrEmpty(AccessKey);

        public string Username { get; set; }

        public string AccessKey { get; set; }

        /// <summary>Url for connecting using RemoteWebDriver</summary>
        public readonly string RemoteServerUrl;
    }
}
