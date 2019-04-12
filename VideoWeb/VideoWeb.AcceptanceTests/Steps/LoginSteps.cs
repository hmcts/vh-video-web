using System.Linq;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class LoginSteps
    {
        private readonly BrowserContext _browserContext;
        private readonly TestContext _context;
        private readonly MicrosoftLoginPage _loginPage;
        private readonly CommonPages _commonPageElements;

        public LoginSteps(BrowserContext browserContext, TestContext context, 
            MicrosoftLoginPage loginPage, CommonPages commonPageElements)
        {
            _browserContext = browserContext;
            _context = context;
            _loginPage = loginPage;
            _commonPageElements = commonPageElements;
        }

        [Given(@"the login page is open")]
        public void GivenUserIsOnTheMicrosoftLoginPage()
        {
            _browserContext.Retry(() =>
            {
                _browserContext.PageUrl().Should().Contain("login.microsoftonline.com");
            }, 10);
        }

        [When(@"the (.*) attempts to login with valid credentials")]
        public void WhenUserLogsInWithValidCredentials(string role)
        {
            _context.CurrentUser = role.Contains("with no hearings") ? _context.TestSettings.UserAccounts.LastOrDefault(c => c.Role == role.Split(" ")[0]) : _context.TestSettings.UserAccounts.FirstOrDefault(c => c.Role == role);
            if (_context.CurrentUser != null)
                _loginPage.Logon(_context.CurrentUser.Username, _context.TestSettings.TestUserPassword);
        }

        [Then(@"the sign out link is displayed")]
        public void ThenTheHearingListPageIsDisplayed()
        {
            _browserContext.NgDriver.WaitUntilElementVisible(_commonPageElements.SignOutLink).Displayed.Should().BeTrue();
        }
    }
}
