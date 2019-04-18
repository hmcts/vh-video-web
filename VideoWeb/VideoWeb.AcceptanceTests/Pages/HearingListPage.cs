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
        public By _waitToSignInText(string caseNumber) => By.XPath($"//tr//*[contains(text(),'{caseNumber}')]/../../..//td//p[contains(text(),'Sign in Today')]/../p[contains(text(),':')]");
        public By _signInButton(string caseNumber) => By.XPath($"//tr//*[contains(text(),'{caseNumber}')]/../../../..//input[@role='button' and @value='Sign into hearing']");        
        public By _startHearingButton(string caseNumber) => By.XPath($"//tr//*[contains(text(),'{caseNumber}')]/../../../..//input[@role='button' and @value='Start hearing']");

        public By ParticipantHearingDate(string caseNumber) => By.XPath($"//strong[contains(text(),'{caseNumber}')]/../../..//td/p[contains(text(),'20')]");
        public By ParticipantHearingTime(string caseNumber) => By.XPath($"//strong[contains(text(),'{caseNumber}')]/../../..//td/p[contains(text(),':')]");

        public By JudgeHearingDate(string caseNumber) =>
            By.XPath($"//p[contains(text(),'{caseNumber}')]/../../../../td/p[contains(text(),'20')]");
        public By JudgeHearingTime(string caseNumber) =>
            By.XPath($"//p[contains(text(),'{caseNumber}')]/../../../../td/p[contains(text(),':')]");
        public By JudgeHearingListedFor(string caseNumber) =>
            By.XPath($"//p[contains(text(),'{caseNumber}')]/../../../../td/p[contains(text(),'listed for')]");

        public By CaseType(string caseNumber, string caseType) =>
            By.XPath($"//p[contains(text(),'{caseNumber}')]/../../../p[contains(text(),'{caseType}')]");

        public By ParticipantsStatus(string caseNumber) =>
            By.XPath($"//p[contains(text(),'{caseNumber}')]/../../../../td/p[contains(text(),'Available')]");
    }
}
