using System.Collections.Generic;
using System.Linq;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Driver;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Driver.Support;
using AcceptanceTests.Common.PageObject.Pages;
using BoDi;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using TimeZone = AcceptanceTests.Common.Data.Time.TimeZone;

namespace VideoWeb.AcceptanceTests.Hooks
{
    [Binding]
    public class DriverHooks
    {
        private Dictionary<string, UserBrowser> _browsers;
        private readonly IObjectContainer _objectContainer;

        public DriverHooks(IObjectContainer objectContainer)
        {
            _objectContainer = objectContainer;
        }

        [BeforeScenario(Order = (int)HooksSequence.InitialiseBrowserHooks)]
        public void InitialiseBrowserContainer()
        {
            _browsers = new Dictionary<string, UserBrowser>();
            _objectContainer.RegisterInstanceAs(_browsers);
        }

        [BeforeScenario(Order = (int) HooksSequence.ConfigureDriverHooks)]
        public void ConfigureDriver(TestContext context, ScenarioContext scenario)
        {
            DriverManager.KillAnyLocalDriverProcesses();
            var browserAndVersion = GetBrowserAndVersion();
            context.VideoWebConfig.TestConfig.TargetBrowser = GetTargetBrowser(browserAndVersion);
            context.VideoWebConfig.TestConfig.TargetDevice = DriverManager.GetTargetDevice(NUnit.Framework.TestContext.Parameters["TargetDevice"]);

            var driverOptions = new DriverOptions()
            {
                TargetBrowser = context.VideoWebConfig.TestConfig.TargetBrowser,
                TargetDevice = context.VideoWebConfig.TestConfig.TargetDevice
            };

            var sauceLabsOptions = new SauceLabsOptions()
            {
                BrowserVersion = GetBrowserVersion(browserAndVersion),
                EnableLogging = EnableLogging(scenario.ScenarioInfo),
                Title = scenario.ScenarioInfo.Title
            };

            OpenQA.Selenium.Proxy proxy = null;
            if (context.ZapConfiguration.SetUpProxy)
            {
                proxy = new OpenQA.Selenium.Proxy();
                var proxySetting = $"{context.ZapConfiguration.ApiAddress}:{context.ZapConfiguration.ApiPort}";
                proxy.HttpProxy = proxySetting;
                proxy.SslProxy = proxySetting;
            }

            context.Driver = new DriverSetup(context.VideoWebConfig.SauceLabsConfiguration, driverOptions, sauceLabsOptions,proxy);
        }

        private static string GetBrowserAndVersion()
        {
            return NUnit.Framework.TestContext.Parameters["TargetBrowser"] ?? "";
        }

        private static TargetBrowser GetTargetBrowser(string browserAndVersion)
        {
            return DriverManager.GetTargetBrowser(browserAndVersion.Contains(":") ? browserAndVersion.Split(":")[0] : browserAndVersion);
        }

        private static string GetBrowserVersion(string browserAndVersion)
        {
            return browserAndVersion.Contains(":") ? browserAndVersion.Split(":")[1] : "latest";
        }

        private static bool EnableLogging(ScenarioInfo scenario)
        {
            return !scenario.Tags.Contains("DisableLogging");
        }

        [BeforeScenario(Order = (int)HooksSequence.SetTimeZone)]
        public void SetTimeZone(TestContext context)
        {
            context.TimeZone = new TimeZone(context.VideoWebConfig.SauceLabsConfiguration.RunningOnSauceLabs(), context.VideoWebConfig.TestConfig.TargetBrowser);
        }

        [AfterScenario(Order = (int) HooksSequence.SignOutHooks)]
        public void SignOutIfPossible(TestContext context)
        {
            if (context.CurrentUser == null) return;
            if (_browsers?[context.CurrentUser.Key].Driver == null) return;
            if (SignOutLinkIsPresent(context.CurrentUser.Key))
                SignOut(context.CurrentUser.Key);
        }

        public bool SignOutLinkIsPresent(string key)
        {
            try
            {
                _browsers[key].Driver.FindElement(CommonPages.SignOutLink, 2);
                return true;
            }
            catch
            {
                return false;
            }
        }

        private void SignOut(string key)
        {
            try
            {
                _browsers[key].ClickLink(CommonPages.SignOutLink, 2);
                _browsers[key].Driver.WaitUntilVisible(CommonPages.SignOutMessage).Displayed.Should().BeTrue();
            }
            catch
            {
                NUnit.Framework.TestContext.WriteLine($"Attempted to sign out but link no longer visible");
            }
        }

        [AfterScenario(Order = (int)HooksSequence.LogResultHooks)]
        public void LogResult(TestContext context, ScenarioContext scenarioContext)
        {
            if (_browsers == null) return;
            if (_browsers.Count.Equals(0))
            {
                context.CurrentUser = UserManager.GetDefaultParticipantUser(context.UserAccounts);
                var browser = new UserBrowser()
                    .SetBaseUrl(context.VideoWebConfig.VhServices.VideoWebUrl)
                    .SetTargetBrowser(context.VideoWebConfig.TestConfig.TargetBrowser)
                    .SetDriver(context.Driver);
                _browsers.Add(context.CurrentUser.Key, browser);
            }

            DriverManager.LogTestResult(
                context.VideoWebConfig.SauceLabsConfiguration.RunningOnSauceLabs(),
                _browsers[context.CurrentUser.Key].Driver,
                scenarioContext.TestError == null);
        }

        [AfterScenario(Order = (int)HooksSequence.TearDownBrowserHooks)]
        public void TearDownBrowser()
        {
            if (_browsers != null)
                DriverManager.TearDownBrowsers(_browsers);

            DriverManager.KillAnyLocalDriverProcesses();
        }

        [AfterScenario(Order = (int)HooksSequence.StopEdgeChromiumServer)]
        public void StopEdgeChromiumServer(TestContext context)
        {
            var targetBrowser = GetBrowserAndVersion();
            if (targetBrowser.ToLower().Contains(TargetBrowser.EdgeChromium.ToString().ToLower()) &&
                !context.VideoWebConfig.SauceLabsConfiguration.RunningOnSauceLabs())
                _browsers?[context.CurrentUser.Key].StopEdgeChromiumServer();
        }
    }
}
