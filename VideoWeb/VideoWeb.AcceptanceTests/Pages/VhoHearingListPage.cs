using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class VhoHearingListPage
    {
        public static By VideoHearingsCaseNumbers => By.XPath($"//div[@class='govuk-summary-list__row']//p[contains(text(),'/')]");
        public static By VideoHearingsOfficerTime(string caseNumber) => By.XPath($"//p[contains(text(),'{caseNumber}')]/../../..//p[contains(text(),':')]");
        public static By VideoHearingsOfficerListedFor(string caseNumber) => By.XPath($"//p[contains(text(),'{caseNumber}')]/../../..//span[contains(text(),'hour') or contains(text(),'minute')]");
        public static By VideoHearingsOfficerNumberOfAlerts(string caseNumber) => By.XPath($"//p[contains(text(),'{caseNumber}')]/../../..//p[contains(text(),'Alert')]");
        public static By VideoHearingsOfficerAlertType(string caseNumber) => By.XPath($"//p[contains(text(),'{caseNumber}')]/../..//span");
        public static By VideoHearingsOfficerSelectHearingButton(string caseNumber) => By.XPath($"//p[contains(text(),'{caseNumber}')]/../..//span");
        public static By VhoHearingRows => By.XPath("//div[contains(@class,'govuk-summary-list__row')]");
    }
}
