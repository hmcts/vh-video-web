using System.Collections.Generic;
using AcceptanceTests.Common.Driver;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.PageObject.Pages;
using BoDi;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;

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
            context.VideoWebConfig.TestConfig.TargetBrowser = DriverManager.GetTargetBrowser(NUnit.Framework.TestContext.Parameters["TargetBrowser"]);
            context.VideoWebConfig.TestConfig.TargetDevice = DriverManager.GetTargetDevice(NUnit.Framework.TestContext.Parameters["TargetDevice"]);
            DriverManager.KillAnyLocalDriverProcesses();
            context.Driver = new DriverSetup(
                context.VideoWebConfig.SauceLabsConfiguration, 
                scenarioContext.ScenarioInfo,
                context.VideoWebConfig.TestConfig.TargetDevice,
                context.VideoWebConfig.TestConfig.TargetBrowser);
        }

        [AfterScenario(Order = (int) HooksSequence.SignOutHooks)]
        public void SignOutIfPossible(TestContext context)
        {
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
            _browsers[key].ClickLink(CommonPages.SignOutLink, 2);
            _browsers[key].Driver.WaitUntilVisible(CommonPages.SignOutMessage).Displayed.Should().BeTrue();
        }

        [AfterScenario(Order = (int)HooksSequence.LogResultHooks)]
        public void LogResult(TestContext context, ScenarioContext scenarioContext)
        {
            if (_browsers != null)
            {
                DriverManager.LogTestResult(
                    context.VideoWebConfig.SauceLabsConfiguration.RunningOnSauceLabs(),
                    _browsers.Count > 0 ? _browsers[context.CurrentUser.Key].Driver : context.Driver.GetDriver(""),
                    scenarioContext.TestError == null);
            }
        }

        [AfterScenario(Order = (int)HooksSequence.TearDownBrowserHooks)]
        public void TearDownBrowser(TestContext context, ScenarioContext scenarioContext)
        {
            if (_browsers != null)
                DriverManager.TearDownBrowsers(_browsers);

            DriverManager.KillAnyLocalDriverProcesses();
        }
    }
}
