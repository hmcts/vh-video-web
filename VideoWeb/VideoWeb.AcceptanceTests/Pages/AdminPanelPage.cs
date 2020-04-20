using System;
using AcceptanceTests.Common.PageObject.Helpers;
using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class AdminPanelPage
    {
        public const string AdminIframeId = "admin-frame";
        public static By AlertsHeader = CommonLocators.ElementContainingText("Alerts for this hearing");
        public static By ParticipantStatusTable = By.Id("participant-status-table");
        public static By ParticipantStatus(Guid participantId) => By.Id($"participant-status-{participantId}");
        public static By ParticipantInIframe(string displayName) => By.XPath($"//b[contains(text(),'{displayName}')]");
        public static By VhoPrivateConsultationLink(Guid participantId) => By.XPath($"//a[contains(@href,'{participantId}') and @aria-label='Private consultation']");
        public static By IncomingVideo = By.Id("incomingVideo");
        public static By IncomingFeed = By.Id("incomingFeedPrivate");
        public static By SelfViewVideo = By.Id("selfviewVideo");
        public static By SelfViewButton = By.Id("selfViewButton");
        public static By CloseButton = By.Id("closeButton");
        public static By TaskActionedBy(Guid taskId) => By.Id($"{taskId:D}-actioned-by");
        public static By TaskCheckbox(Guid taskId) => By.Id($"{taskId:D}-checkbox");
        public static By TaskCreatedDate(Guid taskId) => By.Id($"{taskId:D}-created-date");
        public static By TaskDetails(Guid taskId) => By.Id($"{taskId:D}-type");
        public static By TaskFromUser(Guid taskId) => By.Id($"{taskId:D}-from-user");
    }
}
