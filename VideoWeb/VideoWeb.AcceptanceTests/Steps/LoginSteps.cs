using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class LoginSteps : ISteps
    {
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
            EnterUsername(_c.CurrentUser.Username);
            ClickNextButton();
            EnterPassword(_c.VideoWebConfig.TestConfig.TestUserPassword);
            ClickSignInButton();
        }

        public void EnterUsername(string username)
        {
            NUnit.Framework.TestContext.WriteLine($"Logging in as {username}");

            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(LoginPage.UsernameTextfield).Clear();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(LoginPage.UsernameTextfield).SendKeys(username);
        }

        public void ClickNextButton() => _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(LoginPage.Next).Click();

        public void EnterPassword(string password)
        {
            var maskedPassword = new string('*', (password ?? string.Empty).Length);
            NUnit.Framework.TestContext.WriteLine($"Using password {maskedPassword}");
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(LoginPage.PasswordField).Clear();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(LoginPage.PasswordField).SendKeys(password);
        }

        public void ClickSignInButton() => _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(LoginPage.SignIn).Click();

        [When(@"the user attempts to logout and log back in")]
        public void WhenTheUserAttemptsToLogout()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementClickable(CommonPages.SignOutLink).Click();

            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(CommonPages.SignOutMessage)
                .Displayed.Should().BeTrue();

            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementClickable(CommonPages.SignInLink).Click();
        }

        [Then(@"the user should be navigated to sign in screen")]
        public void ThenTheUserShouldBeNavigatedToSignInScreen()
        {
            _browsers[_c.CurrentUser.Key].Retry(() => _browsers[_c.CurrentUser.Key].Driver.Title.Trim().Should().Be(LoginPage.SignInTitle), 2);
        }

        [Then(@"the sign out link is displayed")]
        public void ThenTheSignOutLinkIsDisplayed()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(CommonPages.SignOutLink).Displayed.Should().BeTrue();
        }
    }
}
