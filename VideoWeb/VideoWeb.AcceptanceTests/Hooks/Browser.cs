using System;
using System.Diagnostics;
using System.Linq;
using System.Net;
using FluentAssertions;
using Microsoft.Extensions.Options;
using TechTalk.SpecFlow;
using Testing.Common.Configuration;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.Common.Security;
using TestContext = VideoWeb.AcceptanceTests.Contexts.TestContext;

namespace VideoWeb.AcceptanceTests.Hooks
{
    [Binding]
    public sealed class Browser
    {
        private readonly BrowserContext _browserContext;
        private readonly TestContext _context;
        private readonly SauceLabsSettings _saucelabsSettings;
        private readonly ScenarioContext _scenarioContext;

        public Browser(BrowserContext browserContext, TestContext context, SauceLabsSettings saucelabsSettings,
            ScenarioContext injectedContext)
        {
            _browserContext = browserContext;
            _context = context;
            _saucelabsSettings = saucelabsSettings;
            _scenarioContext = injectedContext;
        }

        private TargetBrowser GetTargetBrowser()
        {
            _browserContext.TargetBrowser = Enum.TryParse(NUnit.Framework.TestContext.Parameters["TargetBrowser"], true, out TargetBrowser targetTargetBrowser) ? targetTargetBrowser : TargetBrowser.Chrome;
            return _browserContext.TargetBrowser;
        }

        [BeforeScenario]
        public void BeforeScenario(TestContext testContext)
        {
            var azureAdConfiguration = new BookingsConfigLoader().ReadAzureAdSettings();

            var testSettings = new BookingsConfigLoader().ReadTestSettings();
            testSettings.UserAccounts = new BookingsConfigLoader().ReadUserAccountSettings();

            foreach (var user in testSettings.UserAccounts)
            {
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
            testContext.TargetBrowser = GetTargetBrowser();
            testContext.RunningLocally = testContext.VideoApiBaseUrl.Contains("localhost");

            testContext.Environment = new SeleniumEnvironment(_saucelabsSettings, _scenarioContext.ScenarioInfo, testContext.TargetBrowser);            
        }

        [BeforeScenario]
        public void LaunchBrowser(TestContext testContext, ScenarioContext scenarioContext)
        {
            if (!scenarioContext.ScenarioInfo.Tags.Contains("ApiOnly")) return;
            _browserContext.BrowserSetup(testContext.VideoWebUrl, testContext.Environment);
            _browserContext.NavigateToPage();
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
        public void AfterScenario()
        {
            if (_saucelabsSettings.RunWithSaucelabs)
            {
                var passed = _scenarioContext.TestError == null;
                SaucelabsResult.LogPassed(passed, _browserContext.NgDriver);
            }

            if (!_scenarioContext.ScenarioInfo.Tags.Contains("ApiOnly")) return;
            _browserContext.NgDriver.Quit();
            _browserContext.NgDriver.Dispose();

            foreach (var driver in _context.WrappedDrivers.Values)
            {
                try
                {
                    driver.Quit();
                    driver.Dispose();
                }
                catch (Exception ex)
                {
                    NUnit.Framework.TestContext.WriteLine(ex.Message);
                }
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
    }
}
