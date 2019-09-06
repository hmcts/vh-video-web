using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class VhoHearingListPage : HearingListPage
    {
        public By VideoHearingsCaseNumbers =>
            By.XPath($"//div[@class='govuk-summary-list__row']//p[contains(text(),'/')]");
        public By VideoHearingsOfficerTime(string caseNumber) =>
            By.XPath($"//p[contains(text(),'{caseNumber}')]/../../..//p[contains(text(),':')]");
        public By VideoHearingsOfficerListedFor(string caseNumber) =>
            By.XPath($"//p[contains(text(),'{caseNumber}')]/../../..//span[contains(text(),'hour') or contains(text(),'minute')]");
        public By VideoHearingsOfficerNumberofAlerts(string caseNumber) =>
            By.XPath($"//p[contains(text(),'{caseNumber}')]/../../..//p[contains(text(),'Alert')]");
        public By VideoHearingsOfficerAlertType(string caseNumber) =>
            By.XPath($"//p[contains(text(),'{caseNumber}')]/../..//span");
        public By VideoHearingsOfficerSelectHearingButton(string caseNumber) =>
            By.XPath($"//p[contains(text(),'{caseNumber}')]/../..//span");
        public By VhoHearingRows => By.XPath("//div[contains(@class,'govuk-summary-list__row')]");
        public By WaitingRoomText => CommonLocators.ElementContainingText("Waiting");
    }
}
