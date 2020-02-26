using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Helpers
{
    public class GetChatMessages
    {
        private readonly UserBrowser _browser;
        private readonly List<ChatMessage> _chatMessages;

        public GetChatMessages(UserBrowser browser)
        {
            _browser = browser;
            _chatMessages = new List<ChatMessage>();
        }

        public List<ChatMessage> Fetch()
        {
            var messagesCount = _browser.Driver.WaitUntilElementsVisible(InstantMessagePage.Messages).Count;
            messagesCount.Should().BePositive();
            GetMessages(messagesCount);
            return _chatMessages;
        }

        private void GetMessages(int messageCount)
        {
            for (var i = 0; i < messageCount; i++)
            {
                var message = new ChatMessage
                {
                    Message = _browser.Driver.WaitUntilElementsVisible(InstantMessagePage.ChatMessage)[i].Text.Trim()
                };
                var senderAndTime = _browser.Driver.WaitUntilElementsVisible(InstantMessagePage.ChatSenderAndTime)[i].Text.Trim();
                var text = SeparateAndRemoveBrackets(senderAndTime);
                message.Sender = text[0];
                message.Time = text[1];
                _chatMessages.Add(message);
            }
        }

        private static string[] SeparateAndRemoveBrackets(string text)
        {
            return text.Replace(")", "").Trim().Split("(");
        }

    }
}
