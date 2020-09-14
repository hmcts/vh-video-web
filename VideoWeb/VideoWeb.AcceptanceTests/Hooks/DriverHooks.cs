using System.Collections.Generic;
using System.Linq;
using AcceptanceTests.Common.Api;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Enums;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Driver.Settings;
using AcceptanceTests.Common.PageObject.Pages;
using BoDi;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.Services.TestApi;
using TimeZone = AcceptanceTests.Common.Data.Time.TimeZone;

namespace VideoWeb.AcceptanceTests.Hooks
{
    [Binding]
    public class DriverHooks
    {
        private Dictionary<User, UserBrowser> _browsers;
        private readonly IObjectContainer _objectContainer;

        public DriverHooks(IObjectContainer objectContainer)
        {
            _objectContainer = objectContainer;
        }

        [BeforeScenario(Order = (int)HooksSequence.InitialiseBrowserHooks)]
        public void InitialiseBrowserContainer()
        {
            _browsers = new Dictionary<User, UserBrowser>();
            _objectContainer.RegisterInstanceAs(_browsers);
        }

        [BeforeScenario(Order = (int) HooksSequence.ConfigureDriverHooks)]
        public void ConfigureDriver(TestContext context, ScenarioContext scenario)
        {
            DriverManager.KillAnyLocalDriverProcesses();
            context.VideoWebConfig.TestConfig.TargetBrowser = DriverManager.GetTargetBrowser(NUnit.Framework.TestContext.Parameters["TargetBrowser"]);
            context.VideoWebConfig.TestConfig.TargetBrowserVersion = NUnit.Framework.TestContext.Parameters["TargetBrowserVersion"];
            context.VideoWebConfig.TestConfig.TargetDevice = DriverManager.GetTargetDevice(NUnit.Framework.TestContext.Parameters["TargetDevice"]);
            context.VideoWebConfig.TestConfig.TargetDeviceName = NUnit.Framework.TestContext.Parameters["TargetDeviceName"];
            context.VideoWebConfig.TestConfig.TargetOS = DriverManager.GetTargetOS(NUnit.Framework.TestContext.Parameters["TargetOS"]);

            var driverOptions = new DriverOptions()
            {
                TargetBrowser = context.VideoWebConfig.TestConfig.TargetBrowser,
                TargetBrowserVersion = context.VideoWebConfig.TestConfig.TargetBrowserVersion,
                TargetDevice = context.VideoWebConfig.TestConfig.TargetDevice,
                TargetOS = context.VideoWebConfig.TestConfig.TargetOS,
                HeadlessMode = context.ZapConfiguration.HeadlessMode
            };

            var sauceLabsOptions = new SauceLabsOptions()
            {
                EnableLogging = EnableLogging(context.VideoWebConfig.TestConfig.TargetOS, context.VideoWebConfig.TestConfig.TargetBrowser, scenario.ScenarioInfo),
                Name = scenario.ScenarioInfo.Title
            };

            OpenQA.Selenium.Proxy proxy = null;
            if (Zap.SetupProxy)
            {
                proxy = new OpenQA.Selenium.Proxy();
                var proxySetting = $"{context.ZapConfiguration.ApiAddress}:{context.ZapConfiguration.ApiPort}";
                proxy.HttpProxy = proxySetting;
                proxy.SslProxy = proxySetting;
            }

            context.Driver = new DriverSetup(context.VideoWebConfig.SauceLabsConfiguration, driverOptions, sauceLabsOptions, proxy);
        }

        private static bool EnableLogging(TargetOS os, TargetBrowser browser, ScenarioInfo scenario)
        {
            if (os == TargetOS.Windows && browser == TargetBrowser.Firefox)
            {
                return false;
            }
            return !scenario.Tags.Contains("DisableLogging");
        }

        [BeforeScenario(Order = (int)HooksSequence.SetTimeZone)]
        public void SetTimeZone(TestContext context)
        {
            context.TimeZone = new TimeZone(context.VideoWebConfig.SauceLabsConfiguration.RunningOnSauceLabs(), context.VideoWebConfig.TestConfig.TargetOS);
        }

        [AfterScenario(Order = (int) HooksSequence.SignOutHooks)]
        public void SignOutIfPossible(TestContext context)
        {
            if (context.CurrentUser == null) return;
            if (_browsers?[context.CurrentUser].Driver == null) return;
            if (SignOutLinkIsPresent(context.CurrentUser))
                SignOut(context.CurrentUser);
        }

        public bool SignOutLinkIsPresent(User user)
        {
            try
            {
                _browsers[user].Driver.FindElement(CommonPages.SignOutLink, 2);
                return true;
            }
            catch
            {
                return false;
            }
        }

        private void SignOut(User user)
        {
            try
            {
                _browsers[user].ClickLink(CommonPages.SignOutLink, 2);
                _browsers[user].Driver.WaitUntilVisible(CommonPages.SignOutMessage).Displayed.Should().BeTrue();
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
                context.CurrentUser = Users.GetDefaultParticipantUser(context.Test.Users);
                var browser = new UserBrowser()
                    .SetBaseUrl(context.VideoWebConfig.VhServices.VideoWebUrl)
                    .SetTargetDevice(context.VideoWebConfig.TestConfig.TargetDevice)
                    .SetTargetBrowser(context.VideoWebConfig.TestConfig.TargetBrowser)
                    .SetDriver(context.Driver);
                _browsers.Add(context.CurrentUser, browser);
            }

            DriverManager.LogTestResult(
                context.VideoWebConfig.SauceLabsConfiguration.RunningOnSauceLabs(),
                _browsers[context.CurrentUser].Driver,
                scenarioContext.TestError == null);
        }

        [AfterScenario(Order = (int)HooksSequence.TearDownBrowserHooks)]
        public void TearDownBrowser()
        {
            if (_browsers != null)
            {
                foreach (var browser in _browsers.Values)
                {
                    browser.BrowserTearDown();
                }
            }

            DriverManager.KillAnyLocalDriverProcesses();
        }
    }
}
