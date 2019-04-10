using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using VideoWeb.Common.Configuration;

namespace Testing.Common.Configuration
{
    public class BookingsConfigLoader
    {
        private readonly IConfigurationRoot _configRoot;

        public BookingsConfigLoader()
        {
            var configRootBuilder = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json")
                .AddJsonFile("useraccounts.json")
                .AddUserSecrets("CA353381-2F0D-47D7-A97B-79A30AFF8B86");
            _configRoot = configRootBuilder.Build();
        }

        public AzureAdConfiguration ReadAzureAdSettings()
        {
            var azureAdConfig = Options.Create(_configRoot.GetSection("AzureAd").Get<AzureAdConfiguration>());
            return azureAdConfig.Value;
        }

        public TestSettings ReadTestSettings()
        {
            var testSettingsOptions = Options.Create(_configRoot.GetSection("Testing").Get<TestSettings>());
            return testSettingsOptions.Value;
        }

        public List<UserAccount> ReadUserAccountSettings()
        {
            var testSettingsOptions = Options.Create(_configRoot.GetSection("UserAccounts").Get<List<UserAccount>>());
            return testSettingsOptions.Value;
        }

        public HearingServicesConfiguration ReadHearingServiceSettings()
        {
            var hearingServiceOptions = Options.Create(_configRoot.GetSection("VhServices").Get<HearingServicesConfiguration>());
            return hearingServiceOptions.Value;
        }

        public IConfigurationRoot GetRoot()
        {
            return _configRoot;
        }
    }
}
