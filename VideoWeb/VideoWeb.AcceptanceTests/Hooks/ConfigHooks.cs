using System.Collections.Generic;
using System.Threading.Tasks;
using AcceptanceTests.Common.Configuration;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Data.TestData;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Configuration;
using VideoWeb.AcceptanceTests.Data;
using VideoWeb.AcceptanceTests.Data.TestData;
using VideoWeb.AcceptanceTests.Helpers;

namespace VideoWeb.AcceptanceTests.Hooks
{
    [Binding]
    public class ConfigHooks
    {
        private readonly IConfigurationRoot _configRoot;

        public ConfigHooks(TestContext context)
        {
            _configRoot = new ConfigurationManager("CA353381-2F0D-47D7-A97B-79A30AFF8B86").BuildConfig();
            context.VideoWebConfig = new VideoWebConfig();
            context.UserAccounts = new List<UserAccount>();
            context.Tokens = new VideoWebTokens();
        }

        [BeforeScenario(Order = (int)HooksSequence.ConfigHooks)]
        public void RegisterSecrets(TestContext context)
        {
            RegisterAzureSecrets(context);
            RegisterCustomTokenSecrets(context);
            RegisterTestUserSecrets(context);
            RegisterTestUsers(context);
            RegisterDefaultData(context);
            RegisterHearingServices(context);
            RegisterSauceLabsSettings(context);
            RunningAppsLocally(context);
            GenerateBearerTokens(context);
        }

        private void RegisterAzureSecrets(TestContext context)
        {
            context.VideoWebConfig.AzureAdConfiguration = Options.Create(_configRoot.GetSection("AzureAd").Get<VideoWebSecurityConfiguration>()).Value;
            context.VideoWebConfig.AzureAdConfiguration.Authority += context.VideoWebConfig.AzureAdConfiguration.TenantId;
            ConfigurationManager.VerifyConfigValuesSet(context.VideoWebConfig.AzureAdConfiguration);
        }

        private void RegisterCustomTokenSecrets(TestContext context)
        {
            context.VideoWebConfig.VideoWebCustomToken = Options.Create(_configRoot.GetSection("CustomToken").Get<VideoWebCustomToken>()).Value;
            ConfigurationManager.VerifyConfigValuesSet(context.VideoWebConfig.VideoWebCustomToken);
        }

        private void RegisterTestUserSecrets(TestContext context)
        {
            context.VideoWebConfig.TestConfig = Options.Create(_configRoot.GetSection("TestUserSecrets").Get<VideoWebTestConfig>()).Value;
            ConfigurationManager.VerifyConfigValuesSet(context.VideoWebConfig.TestConfig);
        }

        private void RegisterTestUsers(TestContext context)
        {
            context.UserAccounts = Options.Create(_configRoot.GetSection("UserAccounts").Get<List<UserAccount>>()).Value;
            context.UserAccounts.Should().NotBeNullOrEmpty();
            foreach (var user in context.UserAccounts)
            {
                user.Key = user.Lastname;
                user.Username = $"{user.DisplayName.Replace(" ", "").Replace("ClerkJudge", "Clerk")}{context.VideoWebConfig.TestConfig.TestUsernameStem}";
            }
        }

        private static void RegisterDefaultData(TestContext context)
        {
            context.Test = new Test
            {
                CommonData = new LoadXmlFile().SerialiseCommonData(),
                TestData = new DefaultDataManager().SerialiseTestData()
            };
        }

        private void RegisterHearingServices(TestContext context)
        {
            context.VideoWebConfig.VhServices = Options.Create(_configRoot.GetSection("VhServices").Get<VideoWebVhServicesConfig>()).Value;
            ConfigurationManager.VerifyConfigValuesSet(context.VideoWebConfig.VhServices);
        }

        private void RegisterSauceLabsSettings(TestContext context)
        {
            context.VideoWebConfig.SauceLabsConfiguration = Options.Create(_configRoot.GetSection("Saucelabs").Get<SauceLabsSettingsConfig>()).Value;
            if (context.VideoWebConfig.SauceLabsConfiguration.RunningOnSauceLabs())
                context.VideoWebConfig.SauceLabsConfiguration.SetRemoteServerUrlForDesktop(context.Test.CommonData.CommonConfig.SauceLabsServerUrl);
        }

        private static void RunningAppsLocally(TestContext context)
        {
            context.VideoWebConfig.VhServices.RunningVideoApiLocally = context.VideoWebConfig.VhServices.VideoApiUrl.Contains("localhost");
            context.VideoWebConfig.VhServices.RunningVideoWebLocally = context.VideoWebConfig.VhServices.VideoWebUrl.Contains("localhost");
        }

        private static async void GenerateBearerTokens(TestContext context)
        {
            context.Tokens.BookingsApiBearerToken = await ConfigurationManager.GetBearerToken(
                context.VideoWebConfig.AzureAdConfiguration, context.VideoWebConfig.VhServices.BookingsApiResourceId);
            context.Tokens.BookingsApiBearerToken.Should().NotBeNullOrEmpty();

            context.Tokens.UserApiBearerToken = await ConfigurationManager.GetBearerToken(
                context.VideoWebConfig.AzureAdConfiguration, context.VideoWebConfig.VhServices.UserApiResourceId);
            context.Tokens.UserApiBearerToken.Should().NotBeNullOrEmpty();

            context.Tokens.VideoApiBearerToken = await ConfigurationManager.GetBearerToken(
                context.VideoWebConfig.AzureAdConfiguration, context.VideoWebConfig.VhServices.VideoApiResourceId);
            context.Tokens.VideoApiBearerToken.Should().NotBeNullOrEmpty();

            context.Tokens.VideoWebBearerToken = await ConfigurationManager.GetBearerToken(
                context.VideoWebConfig.AzureAdConfiguration, context.VideoWebConfig.AzureAdConfiguration.ClientId);
            context.Tokens.VideoApiBearerToken.Should().NotBeNullOrEmpty();
        }
    }
}
