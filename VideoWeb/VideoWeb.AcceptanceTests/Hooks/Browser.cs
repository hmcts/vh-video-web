using System;
using Microsoft.Extensions.Options;
using TechTalk.SpecFlow;
using Testing.Common.Configuration;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.Common.Security;

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

        private static TargetBrowser GetTargetBrowser()
        {
            return Enum.TryParse(NUnit.Framework.TestContext.Parameters["TargetBrowser"], true, out TargetBrowser targetTargetBrowser) ? targetTargetBrowser : TargetBrowser.Chrome;
        }

        [BeforeScenario]
        public void BeforeScenario(TestContext testContext)
        {
            var azureAdConfiguration = new BookingsConfigLoader().ReadAzureAdSettings();
            var testSettings = new BookingsConfigLoader().ReadTestSettings();
            var hearingServiceSettings = new BookingsConfigLoader().ReadHearingServiceSettings();

            testContext.BookingsApiBearerToken = new TokenProvider(Options.Create(azureAdConfiguration)).GetClientAccessToken(
                testSettings.TestClientId, testSettings.TestClientSecret,
                hearingServiceSettings.BookingsApiResourceId);

            testContext.VideoApiBearerToken = new TokenProvider(Options.Create(azureAdConfiguration)).GetClientAccessToken(
                testSettings.TestClientId, testSettings.TestClientSecret,
                hearingServiceSettings.VideoApiResourceId);

            testContext.BookingsApiBaseUrl = hearingServiceSettings.BookingsApiUrl;
            testContext.VideoApiBaseUrl = hearingServiceSettings.VideoApiUrl;
            testContext.VideoWebUrl = hearingServiceSettings.VideoWebUrl;

            testContext.TestSettings = testSettings;

            testContext.Environment = new SeleniumEnvironment(_saucelabsSettings, _scenarioContext.ScenarioInfo, GetTargetBrowser());
            _browserContext.BrowserSetup(testContext.VideoWebUrl, testContext.Environment);
            _browserContext.LaunchSite();
        }

        [AfterScenario]
        public void AfterScenario()
        {
            if (_saucelabsSettings.RunWithSaucelabs)
            {
                var passed = _scenarioContext.TestError == null;
                SaucelabsResult.LogPassed(passed, _browserContext.NgDriver);
            }
            _browserContext.BrowserTearDown();
        }
    }
}
