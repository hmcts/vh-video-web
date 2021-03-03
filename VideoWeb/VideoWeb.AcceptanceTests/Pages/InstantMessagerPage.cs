using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class InstantMessagePage
    {
        private const string RowsLocator = "#chat-list div[class*='message-item-']";
        public static readonly By SendNewMessageTextBox = By.Id("new-message-box");
        public static readonly By SendNewMessageButton = By.Id("send-new-message-btn");
        public static readonly By UnreadMessagesBadge = By.Id("unread-messages");
        public static readonly By OpenChat = By.Id("open-chat-arrow"); 
        public static readonly By CloseChat = By.Id("close-chat-arrow");
        public static readonly By Messages = By.CssSelector($"{RowsLocator}");
        public static readonly By ChatSenderAndTime= By.CssSelector($"{RowsLocator} div.message-meta");
        public static readonly By ChatMessage = By.CssSelector($"{RowsLocator} div:not(.message-meta)");
    }
}
