using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class HearingListPage
    {
        public HearingListPage()
        {
        }

        public By NoHearingsWarningMessage => CommonLocators.ElementContainingText("You have no video hearings");
        public By _hearingWithCaseNumber(string caseNumber) => CommonLocators.ElementContainingText(caseNumber);
        public By _waitToSignInText(string caseNumber) => By.XPath($"//tr//*[contains(text(),'{caseNumber}')]/../../td/p[contains(text(),'Sign in Today')]");
        public By _signInButton(string caseNumber) => By.XPath($"//tr//*[contains(text(),'{caseNumber}')]/../../td/input[@role='button' and @value='Sign into hearing']");        
    }
}
