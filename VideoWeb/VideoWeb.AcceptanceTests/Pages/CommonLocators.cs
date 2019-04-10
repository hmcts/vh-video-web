using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    static class CommonLocators
    {
        public static By ElementContainingText(string text) => By.XPath($"//*[contains(text(), '{text}')]");
    }
}
