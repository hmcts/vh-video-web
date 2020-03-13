using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Driver.Support;
using AcceptanceTests.Common.PageObject.Pages;
using AcceptanceTests.Common.Test.Steps;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class LoginSteps : ISteps
    {
        private const int ReachedThePageRetries = 2;
        private LoginSharedSteps _loginSharedSteps;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _c;

        public LoginSteps(Dictionary<string, UserBrowser> browsers, TestContext c)
        {
            _browsers = browsers;
            _c = c;
        }

        [When(@"the user attempts to login with valid credentials")]
        public void ProgressToNextPage()
        {
            if (_c.VideoWebConfig.TestConfig.TargetBrowser == TargetBrowser.Ie11) return;
            _loginSharedSteps = new LoginSharedSteps(_browsers[_c.CurrentUser.Key], _c.CurrentUser.Username, _c.VideoWebConfig.TestConfig.TestUserPassword);
            _loginSharedSteps.ProgressToNextPage();
        }

        [When(@"the user attempts to logout and log back in")]
        public void WhenTheUserAttemptsToLogout()
        {
            _browsers[_c.CurrentUser.Key].ClickLink(CommonPages.SignOutLink);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(CommonPages.SignOutMessage).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].ClickLink(CommonPages.SignInLink);
        }

        [Then(@"the user should be navigated to sign in screen")]
        public void ThenTheUserShouldBeNavigatedToSignInScreen()
        {
            _browsers[_c.CurrentUser.Key].Retry(() => _browsers[_c.CurrentUser.Key].Driver.Title.Trim().Should().Be(LoginPage.SignInTitle), ReachedThePageRetries);
        }

        [Then(@"the sign out link is displayed")]
        public void ThenTheSignOutLinkIsDisplayed()
        {
            _loginSharedSteps.ThenTheSignOutLinkIsDisplayed();
        }
    }
}
