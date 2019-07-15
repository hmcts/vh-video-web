using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class ClerkHearingListPage : HearingListPage
    {
        private static string ClerkHearingRow(string caseNumber) => $"//*[contains(text(),'{caseNumber}')]/ancestor::tr";

        public By ClerkHearingListTitle = CommonLocators.ElementContainingText("Video hearings for");
        public By ClerkHearingDate(string date) =>
            CommonLocators.ElementContainingText(date);
        public By ClerkHearingTime(string caseNumber) =>
            By.XPath($"{ClerkHearingRow(caseNumber)}//p[contains(text(),'-')]");
        public By ClerkHearingJudge(string caseNumber, string judgeName) =>
            By.XPath($"{ClerkHearingRow(caseNumber)}//p[contains(text(),'{judgeName}')]");
        public By ClerkHearingCaseName(string caseNumber) =>
            By.XPath($"(//*[contains(text(),'{caseNumber}')]/../../p)[1]");
        public By ClerkHearingCaseType(string caseNumber) =>
            By.XPath($"(//*[contains(text(),'{caseNumber}')]/../../p)[2]");
        public By ClerkHearingRepresentatives(string caseNumber) =>
            By.XPath($"{ClerkHearingRow(caseNumber)}//p[contains(text(),'Solicitor')]/span");
        public By ClerkHearingIndividuals(string caseNumber) =>
            By.XPath($"{ClerkHearingRow(caseNumber)}//p[contains(text(),'for')]/span");
        public By StartHearingButton(string caseNumber) => By.XPath($"{ClerkHearingRow(caseNumber)}//input");

        public By ClerkContactUs = CommonLocators.ElementContainingText("Do you need help?");
        public By ClerkPhoneNumber = CommonLocators.ElementContainingText("0300 303 0655");
        public By CheckEquipmentButton = CommonLocators.ButtonWithLabel("Check equipment");
    }
}
