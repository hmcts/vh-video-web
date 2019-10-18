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

        public const string AdminIframeId = "admin-frame";
        public By AdminIframe = By.Id(AdminIframeId);
        public By ParticipantInIframe(string displayName) => By.XPath($"//b[contains(text(),'{displayName}')]");
        public By VhoPrivateConsultationLink(Guid? participantId) => By.XPath($"//a[contains(@href,'{participantId}') and @aria-label='Private consultation']");

        public By IncomingCallMessage => CommonLocators.ElementContainingText("Incoming call from Video Hearings Team");
        public By AcceptPrivateCall => CommonLocators.ButtonWithInnertext("Accept call");
        public By IncomingVideo = By.Id("incomingVideo");
        public By IncomingFeed = By.Id("incomingFeed");
        public By SelfViewVideo = By.Id("selfviewVideo");
        public By SelfViewButton = By.Id("selfViewButton");
        public By MuteButton = By.Id("muteButton");
        public By CloseButton = By.Id("closeButton");
    }
}
