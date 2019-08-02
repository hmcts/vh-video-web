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
    public sealed class LoginSteps
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _tc;
        private readonly LoginPage _loginPage;
        private readonly CommonPages _commonPageElements;

        public LoginSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext, 
            LoginPage loginPage, CommonPages commonPageElements)
        {
            _browsers = browsers;
            _tc = testContext;
            _loginPage = loginPage;
            _commonPageElements = commonPageElements;
        }

        [When(@"the user attempts to login with valid credentials")]
        public void WhenUserLogsInWithValidCredentials()
        {
            EnterUsername(_tc.CurrentUser.Username);
            ClickNextButton();
            EnterPassword(_tc.TestSettings.TestUserPassword);
            ClickSignInButton();
        }

        public void EnterUsername(string username)
        {
            NUnit.Framework.TestContext.WriteLine($"Logging in as {username}");

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementVisible(_loginPage.UsernameTextfield).Clear();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementVisible(_loginPage.UsernameTextfield).SendKeys(username);
        }

        public void ClickNextButton() => _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementVisible(_loginPage.Next).Click();

        public void EnterPassword(string password)
        {
            var maskedPassword = new string('*', (password ?? string.Empty).Length);
            NUnit.Framework.TestContext.WriteLine($"Using password {maskedPassword}");
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementVisible(_loginPage.Passwordfield).Clear();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementVisible(_loginPage.Passwordfield).SendKeys(password);
        }

        public void ClickSignInButton() => _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementVisible(_loginPage.SignIn).Click();

        [Then(@"the sign out link is displayed")]
        public void ThenTheHearingListPageIsDisplayed()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementVisible(_commonPageElements.SignOutLink).Displayed.Should().BeTrue();
        }
    }
}
