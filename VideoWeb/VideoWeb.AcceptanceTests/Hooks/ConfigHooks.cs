using System;
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
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.Video;
using TestContext = VideoWeb.AcceptanceTests.Helpers.TestContext;

namespace VideoWeb.AcceptanceTests.Hooks
{
    [Binding]
    public class ConfigHooks
    {
        private readonly IConfigurationRoot _configRoot;

        public ConfigHooks(TestContext context)
        {
            _configRoot = ConfigurationManager.BuildConfig("CA353381-2F0D-47D7-A97B-79A30AFF8B86", GetTargetEnvironment(), RunOnSauceLabsFromLocal());
            context.VideoWebConfig = new VideoWebConfig();
            context.UserAccounts = new List<UserAccount>();
            context.Tokens = new VideoWebTokens();
        }

        private static string GetTargetEnvironment()
        {
            return NUnit.Framework.TestContext.Parameters["TargetEnvironment"] ?? "";
        }

        private static bool RunOnSauceLabsFromLocal()
        {
            return NUnit.Framework.TestContext.Parameters["RunOnSauceLabs"] != null &&
                   NUnit.Framework.TestContext.Parameters["RunOnSauceLabs"].Equals("true");
        }

        [BeforeScenario(Order = (int)HooksSequence.ConfigHooks)]
        public async Task RegisterSecrets(TestContext context)
        {
            RegisterAzureSecrets(context);
            RegisterCustomTokenSecrets(context);
            RegisterTestUserSecrets(context);
            RegisterTestUsers(context);
            RegisterDefaultData(context);
            RegisterHearingServices(context);
            RegisterWowzaSettings(context);
            RegisterSauceLabsSettings(context);
            RunningAppsLocally(context);
            RegisterZapSettings(context);
            await GenerateBearerTokens(context);
        }

        private void RegisterZapSettings(TestContext context)
        {
            context.ZapConfiguration = Options.Create(_configRoot.GetSection("ZapConfiguration").Get<ZapConfiguration>()).Value;
        }

        private void RegisterAzureSecrets(TestContext context)
        {
            context.VideoWebConfig.AzureAdConfiguration = Options.Create(_configRoot.GetSection("AzureAd").Get<VideoWebSecurityConfiguration>()).Value;
            context.VideoWebConfig.AzureAdConfiguration.Authority += context.VideoWebConfig.AzureAdConfiguration.TenantId;
            ConfigurationManager.VerifyConfigValuesSet(context.VideoWebConfig.AzureAdConfiguration);
        }

        private void RegisterCustomTokenSecrets(TestContext context)
        {
            context.VideoWebConfig.VideoWebKinlyConfiguration = Options.Create(_configRoot.GetSection("KinlyConfiguration").Get<KinlyConfiguration>()).Value;
        }

        private void RegisterTestUserSecrets(TestContext context)
        {
            context.VideoWebConfig.TestConfig = Options.Create(_configRoot.GetSection("Testing").Get<VideoWebTestConfig>()).Value;
            context.VideoWebConfig.TestConfig.TargetBrowser.Should().NotBeNull();
            context.VideoWebConfig.TestConfig.TargetDevice.Should().NotBeNull();
            context.VideoWebConfig.TestConfig.TargetOS.Should().NotBeNull();
            context.VideoWebConfig.TestConfig.TestUsernameStem.Should().NotBeNull();
            context.VideoWebConfig.TestConfig.TestUserPassword.Should().NotBeNull();
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
                Case = new CaseResponse(),
                CommonData = LoadXmlFile.SerialiseCommonData(),
                Conference = new ConferenceDetailsResponse(),
                ConferenceParticipants = new List<ParticipantDetailsResponse>(),
                Conferences = new List<ConferenceDetailsResponse>(),
                Hearing = new HearingDetailsResponse(),
                HearingParticipants = new List<ParticipantResponse>(),
                NewConferenceId = Guid.Empty,
                NewHearingId = Guid.Empty,
                TestData = new DefaultDataManager().SerialiseTestData()
            };
        }

        private void RegisterHearingServices(TestContext context)
        {
            context.VideoWebConfig.VhServices = Options.Create(_configRoot.GetSection("VhServices").Get<VideoWebVhServicesConfig>()).Value;
            ConfigurationManager.VerifyConfigValuesSet(context.VideoWebConfig.VhServices);
        }

        private void RegisterWowzaSettings(TestContext context)
        {
            context.VideoWebConfig.Wowza = Options.Create(_configRoot.GetSection("WowzaConfiguration").Get<WowzaConfiguration>()).Value;
            ConfigurationManager.VerifyConfigValuesSet(context.VideoWebConfig.Wowza);
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

        private static async Task GenerateBearerTokens(TestContext context)
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
            context.Tokens.VideoWebBearerToken.Should().NotBeNullOrEmpty();

            context.Tokens.CallbackBearerToken = GenerateTemporaryTokens.SetCustomJwTokenForCallback(context.VideoWebConfig.VideoWebKinlyConfiguration);
            context.Tokens.CallbackBearerToken.Should().NotBeNullOrEmpty();
        }
    }
}
