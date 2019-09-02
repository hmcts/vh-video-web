using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class HearingListPage
    {
        public By HearingListPageTitle => By.XPath("//*[contains(text(), 'Video hearings for') or contains(text(),'Your hearings')]");
        public By NoHearingsWarningMessage => CommonLocators.ElementContainingText("You have no video hearings");
        public By HearingWithCaseNumber(string caseNumber) => CommonLocators.ElementContainingText(caseNumber);
        public By WaitToSignInText(string caseNumber) => By.XPath($"//tr//*[contains(text(),'{caseNumber}')]/../../..//td//p[contains(text(),'Sign in Today')]/../p[contains(text(),':')]");
        public By SignInButton(string caseNumber) => By.XPath($"//*[contains(text(),'{caseNumber}')]/ancestor::tr//input[@role='button' and @value='Sign into hearing']");
        public By ParticipantHearingDate(string caseNumber) => By.XPath($"//strong[contains(text(),'{caseNumber}')]/../../..//td/p[contains(text(),'20')]");
        public By ParticipantHearingTime(string caseNumber) => By.XPath($"//strong[contains(text(),'{caseNumber}')]/../../..//td/p[contains(text(),':')]");

        public By CaseType(string caseNumber, string caseType) =>
            By.XPath($"//p[contains(text(),'{caseNumber}')]/../../../p[contains(text(),'{caseType}')]");

        public By ParticipantsStatus(string caseNumber) =>
            By.XPath($"//p[contains(text(),'{caseNumber}')]/../../../../td/p[contains(text(),'Available')]");

        public By ParticipantName(string participantLastName) =>
            By.XPath($"//div[contains(text(),'{participantLastName}')]");

        public By ParticipantContactDetails(string participantLastName, string expected) => 
            By.XPath($"//div[contains(text(),'{participantLastName}')]//*[contains(text(),'{expected}')]");
    }
}
