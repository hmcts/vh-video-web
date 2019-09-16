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
    public sealed class LoginSteps : ISteps
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _tc;
        private readonly LoginPage _loginPage;
        private readonly CommonPages _commonPages;

        public LoginSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext, 
            LoginPage loginPage, CommonPages commonPages)
        {
            _browsers = browsers;
            _tc = testContext;
            _loginPage = loginPage;
            _commonPages = commonPages;
        }

        [When(@"the user attempts to login with valid credentials")]
        public void ProgressToNextPage()
        {
            EnterUsername(_tc.CurrentUser.Username);
            ClickNextButton();
            EnterPassword(_tc.TestSettings.TestUserPassword);
            ClickSignInButton();
        }

        public void EnterUsername(string username)
        {
            NUnit.Framework.TestContext.WriteLine($"Logging in as {username}");

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_loginPage.UsernameTextfield).Clear();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_loginPage.UsernameTextfield).SendKeys(username);
        }

        public void ClickNextButton() => _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_loginPage.Next).Click();

        public void EnterPassword(string password)
        {
            var maskedPassword = new string('*', (password ?? string.Empty).Length);
            NUnit.Framework.TestContext.WriteLine($"Using password {maskedPassword}");
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_loginPage.Passwordfield).Clear();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_loginPage.Passwordfield).SendKeys(password);
        }

        public void ClickSignInButton() => _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_loginPage.SignIn).Click();

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

        [Then(@"the sign out link is displayed")]
        public void ThenTheHearingListPageIsDisplayed()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_commonPages.SignOutLink).Displayed.Should().BeTrue();
        }
    }
}
