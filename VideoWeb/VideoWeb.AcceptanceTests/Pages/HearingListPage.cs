using FluentAssertions;
using OpenQA.Selenium;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class HearingListPage
    {
        private readonly BrowserContext _context;

        public HearingListPage(BrowserContext browserContext)
        {
            _context = browserContext;
        }

        public By NoHearingsWarningMessage => CommonLocators.ElementContainingText("You have no video hearings");
        public By ContactUsLink => CommonLocators.ElementContainingText("Contact us for help");
        public By QuoteYourCaseNumberText => CommonLocators.ElementContainingText("Call us on");
        public By _hearingWithCaseNumber(string caseNumber) => CommonLocators.ElementContainingText(caseNumber);
        public By _waitToSignInText(string caseNumber) => By.XPath($"//tr//*[contains(text(),'{caseNumber}')]/../../td/p[contains(text(),'Sign in Today')]");
        public By _signInButton(string caseNumber) => By.XPath($"//tr//*[contains(text(),'{caseNumber}')]/../../td/input[@role='button' and @value='Sign into hearing']");

        public void HearingListUrl()
        {
            _context.Retry(() => _context.NgDriver.Url.Trim().Should().Contain("hearing-list"));
        }

        public bool TheCaseNumberIsNotDisplayedInTheContactDetails()
        {
            _context.NgDriver.WaitUntilElementClickable(ContactUsLink).Click();
            return _context.NgDriver.WaitUntilElementVisible(QuoteYourCaseNumberText).Text.Contains("and quoting your case number");
        }
    }
}
