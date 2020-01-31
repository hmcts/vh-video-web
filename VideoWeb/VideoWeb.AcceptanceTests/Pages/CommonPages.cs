using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class CommonPages
    {
        public static By SignOutLink => By.PartialLinkText("Sign out");
        public static By SignOutMessage => CommonLocators.ElementContainingText("Signed out successfully");
        public static By SignInLink => By.PartialLinkText("here");
        public static By QuoteYourCaseNumberText => CommonLocators.ElementContainingText("Call us on");
        public static By ContactUsLink => CommonLocators.ElementContainingText("Contact us for help");
        public static By ContactUsEmail => CommonLocators.ElementContainingText("Send us a message");
        public static By BetaBanner => CommonLocators.ElementContainingText("beta");
        public static By ContactUsPhone(string phone) => CommonLocators.ElementContainingText(phone);
    }
}
