using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class CommonPages
    {
        public static By ContactUsLink => CommonLocators.ElementContainingText("Contact us for help");
        public static By BetaBanner => CommonLocators.ElementContainingText("beta");
        public static By ContactUsPhone(string phone) => CommonLocators.ElementContainingText(phone);
        public static By ContactUsEmail(string email) => CommonLocators.ElementContainingText(email);
    }
}
