using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class LogoutPage
    {
        public static By ChooseWhoToSignOut(string displayName) => By.XPath($"//div[@class='row tile']//div[text()='{displayName}']");
    }
}
