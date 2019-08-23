using System.Collections.Generic;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.AcceptanceTests.Users;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class LogoutSteps
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _tc;
        private readonly CommonPages _commonPages;
        private readonly LoginPage _loginPage;

        public LogoutSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext, 
            CommonPages commonPages, LoginPage loginPage)
        {
            _browsers = browsers;
            _tc = testContext;
            _commonPages = commonPages;
            _loginPage = loginPage;
        }

        [When(@"the user attempts to logout and log back in")]
        public void WhenTheUserAttemptsToLogout()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementClickable(_commonPages.SignOutLink).Click();

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_commonPages.SignOutMessage)
                .Displayed.Should().BeTrue();

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementClickable(_commonPages.SignInLink).Click();
        }

        [Then(@"the user should be navigated to sign in screen")]
        public void ThenTheUserShouldBeNavigatedToSignInScreen()
        {
            _browsers[_tc.CurrentUser.Key].Retry(() => _browsers[_tc.CurrentUser.Key].Driver.Title.Trim().Should().Be(_loginPage.SignInTitle), 2);
        }
    }
}
