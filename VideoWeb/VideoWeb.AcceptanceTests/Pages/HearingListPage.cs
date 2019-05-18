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

        public By VideoHearingsOfficerTime(string caseNumber) =>
            By.XPath($"//p[contains(text(),'{caseNumber}')]/../../..//p[contains(text(),':')]");
        public By VideoHearingsOfficerListedFor(string caseNumber) =>
            By.XPath($"//p[contains(text(),'{caseNumber}')]/../../..//span[contains(text(),'and')]");
        public By VideoHearingsOfficerNumberofAlerts(string caseNumber) =>
            By.XPath($"//p[contains(text(),'{caseNumber}')]/../../..//p[contains(text(),'Alert')]");
        public By VideoHearingsOfficerAlertType(string caseNumber) =>
            By.XPath($"//p[contains(text(),'{caseNumber}')]/../..//span");
        
        public By VideoHearingsOfficerSelectHearingButton(string caseNumber) =>
            By.XPath($"//p[contains(text(),'{caseNumber}')]/../..//span");

        public By CaseType(string caseNumber, string caseType) =>
            By.XPath($"//p[contains(text(),'{caseNumber}')]/../../../p[contains(text(),'{caseType}')]");

        public By ParticipantsStatus(string caseNumber) =>
            By.XPath($"//p[contains(text(),'{caseNumber}')]/../../../../td/p[contains(text(),'Available')]");

        public const string AdminIframeId = "admin-frame";

        public By AdminIframe => By.XPath($"//iframe[@id='{AdminIframeId}']");

        public By AdminUsernameTextfield => CommonLocators.TextfieldWithName("username");
        public By AdminPasswordTextfield => CommonLocators.TextfieldWithName("password");
        public By SignInButton => CommonLocators.ButtonWithInnertext("Sign in");
        public By WaitingRoomText => CommonLocators.ElementContainingText("Waiting room");

    }
}
