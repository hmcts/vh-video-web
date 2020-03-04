using System;
using AcceptanceTests.Common.PageObject.Helpers;
using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class AdminPanelPage
    {
        public const string AdminIframeId = "admin-frame";
        public static By AlertsHeader = CommonLocators.ElementContainingText("Alerts for this hearing");
        public static By AlertRows = By.XPath("//app-tasks-table//div[contains(@class,'govuk-grid-row')]");
        public static By AlertCheckboxes = By.XPath("//div[@id='tasks-list']//input");
        public static By AlertCheckbox(int row) => By.XPath($"(//div[@id='tasks-list']//input)[{row}]");
        public static By AlertTimestamp = CommonLocators.AlertCellText(":");
        public static By AlertMessage = By.XPath("//div[contains(@class,'task-body')]/p");
        public static By AlertByUser = By.XPath("//div[contains(@class,'task-origin')]/p");
        public static By ActionedBy(string alertType) => By.XPath($"//div[contains(@class,'task-body')]/p[contains(text(),'{alertType}')]/../..//div/p[contains(text(),':')]");
        public static By ParticipantStatusTable = By.Id("participant-status");
        public static By ParticipantStatus(Guid participantId, string name) => By.XPath($"//div[@id='p-row-{participantId}']/..//p[text()!='{name}']");
        public static By ParticipantInIframe(string DisplayName) => By.XPath($"//b[contains(text(),'{DisplayName}')]");
        public static By VhoPrivateConsultationLink(Guid? participantId) => By.XPath($"//a[contains(@href,'{participantId}') and @aria-label='Private consultation']");
        public static By IncomingCallMessage = CommonLocators.ElementContainingText("Incoming call from Video Hearings Team");
        public static By AcceptPrivateCall = CommonLocators.ButtonWithInnerText("Accept call");
        public static By IncomingVideo = By.Id("incomingVideo");
        public static By IncomingFeed = By.Id("incomingFeedPrivate");
        public static By SelfViewVideo = By.Id("selfviewVideo");
        public static By SelfViewButton = By.Id("selfViewButton");
        public static By MuteButton = By.Id("muteButton");
        public static By CloseButton = By.Id("closeButton");
    }
}
