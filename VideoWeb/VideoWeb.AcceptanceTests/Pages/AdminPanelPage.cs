using System;
using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class AdminPanelPage
    {
        public By AlertsHeader => CommonLocators.ElementContainingText("Alerts for this hearing");
        public By AlertRows = By.XPath("//app-tasks-table//div[@class='govuk-grid-row']");
        public By AlertCheckboxes => By.XPath("//div[@id='tasks-list']//input");
        public By AlertCheckbox(int row) => By.XPath($"(//div[@id='tasks-list']//input)[{row}]");
        public By AlertTimestamp => CommonLocators.AlertCellText(":");
        public By AlertMessage => By.XPath("//div[contains(@class,'task-body')]/p");
        public By AlertByUser => By.XPath("//div[contains(@class,'task-origin')]/p");
        public By ActionedBy(string alertType) => By.XPath($"//div[contains(@class,'task-body')]/p[contains(text(),'{alertType}')]/../..//div/p[contains(text(),':')]");
        public By ParticipantStatusTable = By.Id("participant-status");
        public By ParticipantStatus(Guid participantId, string name) => By.XPath($"//div[@id='p-row-{participantId}']/..//p[text()!='{name}']");
    }
}
