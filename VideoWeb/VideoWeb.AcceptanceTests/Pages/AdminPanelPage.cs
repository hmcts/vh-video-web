using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class AdminPanelPage
    {
        public AdminPanelPage()
        {
        }

        public By AlertRows = By.XPath("//div[@class='govuk-summary-list__row']");
        public By AlertCheckboxes => By.XPath("//div[@id='tasks-list']//input");
        public By AlertCheckbox(int row) => By.XPath($"(//div[@id='tasks-list']//input)[{row}]");
        public By AlertTimestamp => CommonLocators.AlertCellText(":");
        public By AlertMessage => By.XPath("//dd[contains(@class,'task-body')]/p");
        public By AlertByUser => By.XPath("//dd[contains(@class,'task-origin')]/p");
        public By ActionedByTimestamp(string alertType) => By.XPath($"//dd[contains(@class,'task-body')]/p[contains(text(),'{alertType}')]/../..//dd/p[contains(text(),':')]");
        public By ActionedByUser(string alertType) => By.XPath($"//dd[contains(@class,'task-body')]/p[contains(text(),'{alertType}')]/../..//dd/p[contains(text(),'@')]");
    }
}
