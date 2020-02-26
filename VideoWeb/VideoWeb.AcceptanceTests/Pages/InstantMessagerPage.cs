using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class InstantMessagePage
    {
        private const string RowsLocator = "//div[@id='chat-list']//div[contains(@class,'govuk-grid-row')]";
        public static By SendNewMessageTextBox = By.Id("new-message-box");
        public static By SendNewMessageButton = By.Id("send-new-message-btn");
        public static By UnreadMessagesBadge = By.Id("unread-messages");
        public static By OpenChat = By.Id("open-chat-arrow"); 
        public static By CloseChat = By.Id("close-chat-arrow");
        public static By Messages = By.XPath($"{RowsLocator}");
        public static By ChatSenderAndTime= By.XPath($"{RowsLocator}//p[not(contains(@class,'chat-message'))]");
        public static By ChatMessage = By.XPath($"{RowsLocator}//p[contains(@class,'chat-message')]");
    }
}
