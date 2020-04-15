using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class PrivateCallPopupPage
    {
        public static By OutgoingCallMessage = By.Id($"receiver");
        public static By IncomingCallMessage = By.Id($"caller");
        public static By VhoIncomingCallMessage = By.Id($"vho-caller");
        public static By CallRejectedMessage = By.Id("receiver-not-accepted");
        public static By CallRejectedCloseButton = By.Id("close-pc-rejection-btn");
        public static By AcceptPrivateCall = By.Id("accept-pc-request-btn");
        public static By RejectPrivateCall = By.Id("reject-pc-request-btn");
        public static By ClosePrivateConsultationButton = By.Id("close-pc-btn");
    }
}
