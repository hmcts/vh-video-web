using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class AdminPanelPage
    {
        public AdminPanelPage()
        {
        }

        public By AlertCheckbox => By.XPath("//div[@id='tasks-list']//input");
        public By AlertTimestamp => CommonLocators.AlertCellText(":");
        public By AlertMessage(string text) => CommonLocators.AlertCellText(text);
        public By AlertBy(string displayname) => By.XPath($"//div[@id='tasks-list']//dd/p[contains(text(),'{displayname}')]");
        public By CompletedByTimestamp => By.XPath("//div[@id='tasks-list']//dd/p[contains(text(),':')]");
        public By CompletedByUser => By.XPath("//div[@id='tasks-list']//dd/p[contains(text(),'@')]");
    }
}
