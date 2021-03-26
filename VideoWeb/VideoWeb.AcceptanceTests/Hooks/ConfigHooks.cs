using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AcceptanceTests.Common.Configuration;
using AcceptanceTests.Common.Data.TestData;
using AcceptanceTests.Common.Exceptions;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Configuration;
using VideoWeb.AcceptanceTests.Data;
using VideoWeb.AcceptanceTests.Data.TestData;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.Common.Security.HashGen;
using TestApi.Contract.Dtos;
using BookingsApi.Contract.Responses;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Security;

namespace VideoWeb.AcceptanceTests.Hooks
{
    [Binding]
    public class ConfigHooks
    {
        private readonly IConfigurationRoot _configRoot;

        public ConfigHooks(TestContext context)
        {
            _configRoot = ConfigurationManager.BuildConfig("CA353381-2F0D-47D7-A97B-79A30AFF8B86", "18c466fd-9265-425f-964e-5989181743a7");
            context.VideoWebConfig = new VideoWebConfig();
            context.Tokens = new VideoWebTokens();
        }

        [BeforeScenario(Order = (int)HooksSequence.ConfigHooks)]
        public async Task RegisterSecrets(TestContext context)
        {
            RegisterAzureSecrets(context);
            RegisterCustomTokenSecrets(context);
            RegisterTestUserSecrets(context);
            RegisterDefaultData(context);
            RegisterIsLive(context);
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
            context.VideoWebConfig.AzureAdConfiguration = Options.Create(_configRoot.GetSection("AzureAd").Get<AzureAdConfiguration>()).Value;
            context.VideoWebConfig.AzureAdConfiguration.ClientId.Should().NotBeNull();
            context.VideoWebConfig.AzureAdConfiguration.ClientSecret.Should().NotBeNull();
            context.VideoWebConfig.AzureAdConfiguration.Authority.Should().NotBeNull();
            context.VideoWebConfig.AzureAdConfiguration.TenantId.Should().NotBeNull();
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
                TestData = new DefaultDataManager().SerialiseTestData(),
                Users = new List<UserDto>()
            };
        }

        private void RegisterIsLive(TestContext context)
        {
            context.VideoWebConfig.IsLive = _configRoot.GetValue<bool>("IsLive");
            context.VideoWebConfig.Should().NotBeNull();
        }

        private void RegisterHearingServices(TestContext context)
        {
            context.VideoWebConfig.VhServices = GetTargetTestEnvironment() == string.Empty ? Options.Create(_configRoot.GetSection("VhServices").Get<VideoWebVhServicesConfig>()).Value
                : Options.Create(_configRoot.GetSection($"Testing.{GetTargetTestEnvironment()}.VhServices").Get<VideoWebVhServicesConfig>()).Value;
            if (context.VideoWebConfig.VhServices == null && GetTargetTestEnvironment() != string.Empty)
            {
                throw new TestSecretsFileMissingException(GetTargetTestEnvironment());
            }
            ConfigurationManager.VerifyConfigValuesSet(context.VideoWebConfig.VhServices);
        }

        private void RegisterWowzaSettings(TestContext context)
        {
            context.VideoWebConfig.Wowza = Options.Create(_configRoot.GetSection("WowzaConfiguration").Get<WowzaConfiguration>()).Value;
            ConfigurationManager.VerifyConfigValuesSet(context.VideoWebConfig.Wowza);
        }

        private void RegisterSauceLabsSettings(TestContext context)
        {
            context.VideoWebConfig.SauceLabsConfiguration = RunOnSauceLabsFromLocal() ?  Options.Create(_configRoot.GetSection("LocalSaucelabs").Get<SauceLabsSettingsConfig>()).Value
                    : Options.Create(_configRoot.GetSection("Saucelabs").Get<SauceLabsSettingsConfig>()).Value;
            if (!context.VideoWebConfig.SauceLabsConfiguration.RunningOnSauceLabs()) return;
            context.VideoWebConfig.SauceLabsConfiguration.SetRemoteServerUrlForDesktop(context.Test.CommonData.CommonConfig.SauceLabsServerUrl);
            context.VideoWebConfig.SauceLabsConfiguration.AccessKey.Should().NotBeNullOrWhiteSpace();
            context.VideoWebConfig.SauceLabsConfiguration.Username.Should().NotBeNullOrWhiteSpace();
            context.VideoWebConfig.SauceLabsConfiguration.RealDeviceApiKey.Should().NotBeNullOrWhiteSpace();
        }

        private static void RunningAppsLocally(TestContext context)
        {
            context.VideoWebConfig.VhServices.RunningTestApiLocally = context.VideoWebConfig.VhServices.TestApiUrl.Contains("localhost");
            context.VideoWebConfig.VhServices.RunningVideoWebLocally = context.VideoWebConfig.VhServices.VideoWebUrl.Contains("localhost");
        }

        private static async Task GenerateBearerTokens(TestContext context)
        {
            var azureAdConfigurationOptions = Options.Create(context.VideoWebConfig.AzureAdConfiguration);
            var tokenProvider = new TokenProvider(azureAdConfigurationOptions);
            context.Tokens.TestApiBearerToken = await tokenProvider.GetClientAccessToken(context.VideoWebConfig.AzureAdConfiguration.ClientId, context.VideoWebConfig.AzureAdConfiguration.ClientSecret, context.VideoWebConfig.VhServices.TestApiResourceId);
            context.Tokens.TestApiBearerToken.Should().NotBeNullOrEmpty();

            context.Tokens.CallbackBearerToken = GenerateTemporaryTokens.SetCustomJwTokenForCallback(context.VideoWebConfig.VideoWebKinlyConfiguration);
            context.Tokens.CallbackBearerToken.Should().NotBeNullOrEmpty();
        }

        private static string GetTargetTestEnvironment()
        {
            return NUnit.Framework.TestContext.Parameters["TargetTestEnvironment"] ?? string.Empty;
        }

        private static bool RunOnSauceLabsFromLocal()
        {
            return NUnit.Framework.TestContext.Parameters["RunOnSauceLabs"] != null &&
                   NUnit.Framework.TestContext.Parameters["RunOnSauceLabs"].Equals("true");
        }
    }
}
