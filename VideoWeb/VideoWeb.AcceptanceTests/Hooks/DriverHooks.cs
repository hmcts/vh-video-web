using System;
using System.Collections.Generic;
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

        [BeforeScenario(Order = (int)HooksSequence.ConfigureDriverHooks)]
        public void ConfigureDriver(TestContext context, ScenarioContext scenarioContext)
        {
            context.VideoWebConfig.TestConfig.TargetDevice = DriverManager.GetTargetDevice(NUnit.Framework.TestContext.Parameters["TargetDevice"]);
            DriverManager.KillAnyLocalDriverProcesses();
            var options = new DriverOptions()
            {
                BrowserVersion = SetBrowserAndVersion(context),
                EnableLogging = true,
                SauceLabsCommandTimeoutInSeconds = 60,
                SauceLabsIdleTimeoutInSeconds = 60,
                TargetBrowser = context.VideoWebConfig.TestConfig.TargetBrowser,
                TargetDevice = context.VideoWebConfig.TestConfig.TargetDevice
            };
            context.Driver = new DriverSetup(
                context.VideoWebConfig.SauceLabsConfiguration, 
                scenarioContext.ScenarioInfo,
                options);
        }

        private static string SetBrowserAndVersion(TestContext context)
        {
            var browserAndVersion = GetBrowserAndVersion();
            if (browserAndVersion.Contains(":"))
            {
                context.VideoWebConfig.TestConfig.TargetBrowser = DriverManager.GetTargetBrowser(browserAndVersion.Split(":")[0]);
                return browserAndVersion.Split(":")[1];
            }
            else
            {
                context.VideoWebConfig.TestConfig.TargetBrowser = DriverManager.GetTargetBrowser(NUnit.Framework.TestContext.Parameters["TargetBrowser"]);
                return "latest";
            }
        }

        private static string GetBrowserAndVersion()
        {
            return NUnit.Framework.TestContext.Parameters["TargetBrowser"] ?? "";
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
                Console.WriteLine($"Attempted to sign out but link no longer visible");
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
            var targetBrowser = GetTargetBrowser();
            if (targetBrowser.ToLower().Equals(TargetBrowser.EdgeChromium.ToString().ToLower()) &&
                !context.VideoWebConfig.SauceLabsConfiguration.RunningOnSauceLabs())
                _browsers?[context.CurrentUser.Key].StopEdgeChromiumServer();
        }

        private static string GetTargetBrowser()
        {
            return NUnit.Framework.TestContext.Parameters["TargetBrowser"] ?? "";
        }
    }
}
