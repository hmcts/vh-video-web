using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using BoDi;
using FluentAssertions;
using Microsoft.Extensions.Options;
using TechTalk.SpecFlow;
using Testing.Common.Configuration;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Users;
using VideoWeb.Common.Security;
using TestContext = VideoWeb.AcceptanceTests.Contexts.TestContext;

namespace VideoWeb.AcceptanceTests.Hooks
{
    [Binding]
    public sealed class BrowserHooks
    {
        private readonly SauceLabsSettings _saucelabsSettings;
        private readonly ScenarioContext _scenarioContext;
        private static Dictionary<string, UserBrowser> _browsers;
        private readonly IObjectContainer _objectContainer;

        public BrowserHooks(IObjectContainer objectContainer, SauceLabsSettings saucelabsSettings, ScenarioContext injectedContext)
        {
            _objectContainer = objectContainer;
            _saucelabsSettings = saucelabsSettings;
            _scenarioContext = injectedContext;
        }

        [BeforeScenario]
        public void InitialiseBrowserContainer()
        {
            _browsers = new Dictionary<string, UserBrowser>();
            _objectContainer.RegisterInstanceAs(_browsers);
        }

        [BeforeScenario]
        public void BeforeScenario(TestContext testContext)
        {
            var azureAdConfiguration = new BookingsConfigLoader().ReadAzureAdSettings();
            testContext.AzureAdConfiguration = azureAdConfiguration;
            testContext.CustomTokenSettings = new BookingsConfigLoader().ReadCustomTokenSettings();
            testContext.CustomTokenSettings.Secret.Should().NotBeNullOrEmpty();
            testContext.CustomTokenSettings.ThirdPartySecret.Should().NotBeNullOrEmpty();

            var testSettings = new BookingsConfigLoader().ReadTestSettings();
            testSettings.UserAccounts = new BookingsConfigLoader().ReadUserAccountSettings();

            foreach (var user in testSettings.UserAccounts)
            {
                user.Key = user.Lastname;
                user.Username = $"{user.Displayname.Replace(" ", "").Replace("ClerkJudge","Clerk")}{testSettings.TestUsernameStem}";
            }

            var hearingServiceSettings = new BookingsConfigLoader().ReadHearingServiceSettings();

            testContext.BookingsApiBearerToken = new TokenProvider(Options.Create(azureAdConfiguration)).GetClientAccessToken(
                testSettings.TestClientId, testSettings.TestClientSecret,
                hearingServiceSettings.BookingsApiResourceId);

            testContext.UserApiBearerToken = new TokenProvider(Options.Create(azureAdConfiguration)).GetClientAccessToken(
                testSettings.TestClientId, testSettings.TestClientSecret,
                hearingServiceSettings.UserApiResourceId);

            testContext.VideoApiBearerToken = new TokenProvider(Options.Create(azureAdConfiguration)).GetClientAccessToken(
                testSettings.TestClientId, testSettings.TestClientSecret,
                hearingServiceSettings.VideoApiResourceId);

            testContext.VideoWebBearerToken = new TokenProvider(Options.Create(azureAdConfiguration)).GetClientAccessToken(
                testSettings.TestClientId, testSettings.TestClientSecret,
                azureAdConfiguration.ClientId);

            testSettings.TestClientId.Should().NotBeNullOrEmpty();
            testSettings.TestClientSecret.Should().NotBeNullOrEmpty();
            testSettings.TestUserPassword.Should().NotBeNullOrEmpty();
            testSettings.TestUsernameStem.Should().NotBeNullOrEmpty();
            testSettings.UserAccounts.Should().HaveCountGreaterThan(0);

            testContext.BookingsApiBaseUrl = hearingServiceSettings.BookingsApiUrl;
            testContext.UserApiBaseUrl = hearingServiceSettings.UserApiUrl;
            testContext.VideoApiBaseUrl = hearingServiceSettings.VideoApiUrl;
            testContext.VideoWebUrl = hearingServiceSettings.VideoWebUrl;

            testContext.TestSettings = testSettings;

            CheckBookingsApiHealth(testContext);
            CheckUserApiHealth(testContext);
            CheckVideoApiHealth(testContext);

            testContext.SaucelabsSettings = _saucelabsSettings;
            KillAnyChromeDriverProcesses(_saucelabsSettings);
            testContext.TargetBrowser = GetTargetBrowser(testContext);
            testContext.RunningVideoWebLocally = testContext.VideoWebUrl.Contains("localhost");
            testContext.RunningVideoApiLocally = testContext.VideoApiBaseUrl.Contains("localhost");
            testContext.DefaultParticipant = testSettings.UserAccounts.First(x => x.DefaultParticipant.Equals(true));
            testContext.Environment = new SeleniumEnvironment(_saucelabsSettings, _scenarioContext.ScenarioInfo, testContext.TargetBrowser);            
        }

        private static TargetBrowser GetTargetBrowser(TestContext context)
        {
            context.TargetBrowser = Enum.TryParse(NUnit.Framework.TestContext.Parameters["TargetBrowser"], true, out TargetBrowser targetTargetBrowser) ? targetTargetBrowser : TargetBrowser.Chrome;
            return context.TargetBrowser;
        }

        public static void KillAnyChromeDriverProcesses(SauceLabsSettings sauceLabsSettings)
        {
            if (sauceLabsSettings.RunWithSaucelabs) return;
            var chromeDriverProcesses = Process.GetProcessesByName("ChromeDriver");

            foreach (var chromeDriverProcess in chromeDriverProcesses)
            {
                try
                {
                    chromeDriverProcess.Kill();
                }
                catch (Exception ex)
                {
                    NUnit.Framework.TestContext.WriteLine(ex.Message);
                }
            }
        }

        public static void CheckBookingsApiHealth(TestContext testContext)
        {
            var endpoint = new BookingsApiUriFactory().HealthCheckEndpoints;
            testContext.Request = testContext.Get(endpoint.HealthCheck);
            testContext.Response = testContext.BookingsApiClient().Execute(testContext.Request);
            testContext.Response.StatusCode.Should().Be(HttpStatusCode.OK, "Unable to connect to the Bookings Api");
        }

        public static void CheckUserApiHealth(TestContext testContext)
        {
            var endpoint = new UserApiUriFactory().HealthCheckEndpoints;
            testContext.Request = testContext.Get(endpoint.CheckServiceHealth());
            testContext.Response = testContext.UserApiClient().Execute(testContext.Request);
            testContext.Response.StatusCode.Should().Be(HttpStatusCode.OK, "Unable to connect to the User Api");
        }

        public static void CheckVideoApiHealth(TestContext testContext)
        {
            var endpoint = new VideoApiUriFactory().HealthCheckEndpoints;
            testContext.Request = testContext.Get(endpoint.CheckServiceHealth());
            testContext.Response = testContext.BookingsApiClient().Execute(testContext.Request);
            testContext.Response.StatusCode.Should().Be(HttpStatusCode.OK, "Unable to connect to the Video Api");
        }

        [AfterScenario]
        public void AfterScenario(Dictionary<string, UserBrowser> browsers, TestContext context)
        {
            if (_saucelabsSettings.RunWithSaucelabs)
            {
                var passed = _scenarioContext.TestError == null;
                LogResultToSaucelabsEvenWithNoDriver(browsers, context, passed);
            }

            foreach (var browser in browsers.Values)
            {
                browser.BrowserTearDown();
            }

            var chromeDriverProcesses = Process.GetProcessesByName("ChromeDriver");

            foreach (var chromeDriverProcess in chromeDriverProcesses)
            {
                try
                {
                     chromeDriverProcess.Kill();
                }
                catch (Exception ex)
                {
                    NUnit.Framework.TestContext.WriteLine(ex.Message);
                }
            }
        }

        private static void LogResultToSaucelabsEvenWithNoDriver(IReadOnlyDictionary<string, UserBrowser> browsers, TestContext context, bool passed)
        {
            if (browsers.Count.Equals(0))
            {
                SaucelabsResult.LogPassed(passed, context.Environment);
            }
            else
            {
                SaucelabsResult.LogPassed(passed, browsers[context.CurrentUser.Key].Driver);
            }
        }
    }
}
