using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Helpers
{
    public class GetChatMessages
    {
        private const int Timeout = 20;
        private readonly UserBrowser _browser;
        private readonly List<ChatMessage> _chatMessages;
        private int _expectedCount;

        public GetChatMessages(UserBrowser browser)
        {
            _browser = browser;
            _chatMessages = new List<ChatMessage>();
        }

        public GetChatMessages WaitFor(int expectedCount)
        {
            _expectedCount = expectedCount;
            return this;
        }

        public List<ChatMessage> Fetch()
        {
            var messagesCount = WaitForAllMessagesToArrive();
            messagesCount.Should().BePositive();
            GetMessages(messagesCount);
            return _chatMessages;
        }

        private int WaitForAllMessagesToArrive()
        {
            for (var i = 0; i < Timeout; i++)
            {
                var messagesCount = _browser.Driver.WaitUntilElementsVisible(InstantMessagePage.Messages).Count;
                if (messagesCount.Equals(_expectedCount))
                {
                    return messagesCount;
                }
                Thread.Sleep(TimeSpan.FromSeconds(1));
            }
            throw new InvalidDataException($"Expected {_expectedCount} chat messages to appear after {Timeout} seconds");
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
