using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class LogoutSteps
    {
        private readonly BrowserContext _browserContext;
        private readonly CommonPages _commonPages;
        private readonly MicrosoftLoginPage _loginPage;

        public LogoutSteps(BrowserContext browserContext, CommonPages commonPages, MicrosoftLoginPage loginPage)
        {
            _browserContext = browserContext;
            _commonPages = commonPages;
            _loginPage = loginPage;
        }

        [When(@"the user attempts to logout")]
        public void WhenTheUserAttemptsToLogout()
        {
            _browserContext.NgDriver.WaitUntilElementClickable(_commonPages.SignOutLink).Click();            
        }

        [Then(@"the user should be navigated to sign in screen")]
        public void ThenTheUserShouldBeNavigatedToSignInScreen()
        {
            _loginPage.SignInTitle();
        }
    }
}
