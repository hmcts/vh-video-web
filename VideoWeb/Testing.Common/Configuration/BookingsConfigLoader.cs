using System.Collections.Generic;
using FluentAssertions;
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
            testSettingsOptions.Value.TestClientId.Should().NotBeNullOrEmpty();
            testSettingsOptions.Value.TestClientSecret.Should().NotBeNullOrEmpty();
            testSettingsOptions.Value.TestUsernameStem.Should().NotBeNullOrEmpty();
            testSettingsOptions.Value.TestUserPassword.Should().NotBeNullOrEmpty();
            testSettingsOptions.Value.AdminUsername.Should().NotBeNullOrEmpty();
            testSettingsOptions.Value.AdminPassword.Should().NotBeNullOrEmpty();
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
            hearingServiceOptions.Value.BookingsApiUrl.Should().NotBeNullOrEmpty();
            hearingServiceOptions.Value.BookingsApiResourceId.Should().NotBeNullOrEmpty();
            hearingServiceOptions.Value.VideoApiUrl.Should().NotBeNullOrEmpty();
            hearingServiceOptions.Value.VideoApiResourceId.Should().NotBeNullOrEmpty();
            hearingServiceOptions.Value.VideoWebUrl.Should().NotBeNullOrEmpty();
            return hearingServiceOptions.Value;
        }

        public IConfigurationRoot GetRoot()
        {
            return _configRoot;
        }
    }
}
