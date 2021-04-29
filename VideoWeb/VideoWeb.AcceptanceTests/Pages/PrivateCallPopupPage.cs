using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class PrivateCallPopupPage
    {
        public static By OutgoingCallMessage = By.Id($"receiver");
        public static By IncomingCallMessage = By.CssSelector($"#toast-container .content span");
        public static By InvitationMessageButton = By.CssSelector($"#toast-container .action button");
        public static By CallRejectedMessage = By.Id("receiver-not-accepted");
        public static By CallRejectedCloseButton = By.Id("close-pc-rejection-btn");
        public static By AcceptPrivateCall = By.XPath("//button[text()='Accept']");
        public static By DeclinePrivateCall = By.XPath("//button[text()='Decline']");
        public static By ClosePrivateConsultationButton = By.Id("close-pc-btn");
    }
}
