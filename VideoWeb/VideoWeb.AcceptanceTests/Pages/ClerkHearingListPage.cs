using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class ClerkHearingListPage
    {
        private static string ClerkHearingRow(string caseNumber) => $"//*[contains(text(),'{caseNumber}')]/ancestor::tr";
        public static By ClerkHearingListTitle = CommonLocators.ElementContainingText("Video hearings for");
        public static By ClerkHearingDate(string date) => CommonLocators.ElementContainingText(date);
        public static By ClerkHearingTime(string caseNumber) => By.XPath($"{ClerkHearingRow(caseNumber)}//p[contains(text(),'-')]");
        public static By ClerkHearingJudge(string caseNumber, string judgeName) => By.XPath($"{ClerkHearingRow(caseNumber)}//p[contains(text(),'{judgeName}')]");
        public static By ClerkHearingCaseName(string caseNumber) => By.XPath($"(//*[contains(text(),'{caseNumber}')]/../../p)[1]");
        public static By ClerkHearingCaseType(string caseNumber) => By.XPath($"(//*[contains(text(),'{caseNumber}')]/../../p)[2]");
        public static By ClerkHearingRepresentatives(string caseNumber) => By.XPath($"{ClerkHearingRow(caseNumber)}//p[contains(text(),'Solicitor')]/span");
        public static By ClerkHearingIndividuals(string caseNumber) => By.XPath($"{ClerkHearingRow(caseNumber)}//p[contains(text(),'for')]/span");
        public static By StartHearingButton(string caseNumber) => By.XPath($"{ClerkHearingRow(caseNumber)}//button");
        public static By ClerkContactUs = CommonLocators.ElementContainingText("Do you need help?");
        public static By ClerkPhoneNumber = CommonLocators.ElementContainingText("0300 303 0655");
        public static By CheckEquipmentButton = CommonLocators.ButtonWithInnertext("Check equipment");
    }
}
