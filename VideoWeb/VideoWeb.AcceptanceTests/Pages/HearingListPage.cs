using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class HearingListPage
    {
        public static By HearingListPageTitle => By.XPath("//*[contains(text(), 'Video hearings for') or contains(text(),'Your hearings')]");
        public static By NoHearingsWarningMessage => CommonLocators.ElementContainingText("You have no video hearings");
        public static By HearingWithCaseNumber(string caseNumber) => CommonLocators.ElementContainingText(caseNumber);
        public static By WaitToSignInText(string caseNumber) => By.XPath($"//tr//*[contains(text(),'{caseNumber}')]/../../..//td//p[contains(text(),'Sign in Today')]/../p[contains(text(),':')]");
        public static By SignInButton(string caseNumber) => By.XPath($"//*[contains(text(),'{caseNumber}')]/ancestor::tr//button[contains(text(),'Sign into hearing')]");
        public static By ParticipantHearingDate(string caseNumber) => By.XPath($"//strong[contains(text(),'{caseNumber}')]/../../..//td/p[contains(text(),'20')]");
        public static By ParticipantHearingTime(string caseNumber) => By.XPath($"//strong[contains(text(),'{caseNumber}')]/../../..//td/p[contains(text(),':')]");
        public static By CaseType(string caseNumber, string caseType) => By.XPath($"//p[contains(text(),'{caseNumber}')]/../../../p[contains(text(),'{caseType}')]");
        public static By ParticipantsStatus(string caseNumber) => By.XPath($"//p[contains(text(),'{caseNumber}')]/../../../../td/p[contains(text(),'Available')]");
        public static By ParticipantName(string participantLastName) => By.XPath($"//div[contains(text(),'{participantLastName}')]");
        public static By ParticipantContactDetails(string participantLastName, string expected) => By.XPath($"//div[contains(text(),'{participantLastName}')]//*[contains(text(),'{expected}')]");
    }
}
