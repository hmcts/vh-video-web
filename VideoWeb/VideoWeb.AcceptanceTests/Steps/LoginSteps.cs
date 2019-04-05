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

        public LoginSteps(BrowserContext browserContext, TestContext context, 
            MicrosoftLoginPage loginPage, HearingListPage hearingListPage)
        {
            _browserContext = browserContext;
            _context = context;
            _loginPage = loginPage;
            _hearingListPage = hearingListPage;
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
            var username = _context.TestSettings.UserAccounts.FirstOrDefault(c => c.Role == role)?.Username;            
            _loginPage.Logon(username, _context.TestSettings.Password);
        }

        [Then(@"the Hearing List page is displayed")]
        public void ThenTheHearingListPageIsDisplayed()
        {
            _hearingListPage.HearingListUrl();
        }

    }
}
