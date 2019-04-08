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
        private readonly HearingListPage _hearingListPage;
        private readonly CommonPages _commonPageElements;

        public LoginSteps(BrowserContext browserContext, TestContext context, 
            MicrosoftLoginPage loginPage, HearingListPage hearingListPage, CommonPages commonPageElements)
        {
            _browserContext = browserContext;
            _context = context;
            _loginPage = loginPage;
            _hearingListPage = hearingListPage;
            _commonPageElements = commonPageElements;
        }

        [Given(@"the user is on the login page")]
        public void GivenIndividualIsOnTheMicrosoftLoginPage()
        {
            _browserContext.Retry(() =>
            {
                _browserContext.PageUrl().Should().Contain("login.microsoftonline.com");
            }, 10);
        }

        [When(@"the (.*) attempts to login with valid credentials")]
        public void WhenIndividualLogsInWithValidCredentials(string role)
        {
            _context.CurrenUser = role.Contains("with no hearings") ? _context.TestSettings.UserAccounts.LastOrDefault(c => c.Role == role.Split(" ")[0]) : _context.TestSettings.UserAccounts.FirstOrDefault(c => c.Role == role);
            if (_context.CurrenUser != null)
                _loginPage.Logon(_context.CurrenUser.Username, _context.TestSettings.Password);
        }

        [Then(@"the Hearing List page is displayed")]
        public void ThenTheHearingListPageIsDisplayed()
        {
            _hearingListPage.HearingListUrl();
            _browserContext.NgDriver.WaitUntilElementVisible(_commonPageElements.SignOutLink).Displayed.Should().BeTrue();
        }

    }
}
