using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using VideoWeb.AcceptanceTests.Helpers;

namespace VideoWeb.AcceptanceTests.Assertions
{
    public static class AssertChatMessage
    {
        public static void Assert(ChatMessage expected, ChatMessage actual)
        {
            actual.Message.Should().Be(expected.Message);
            actual.Sender.Should().Be(expected.Sender);
            var aMinuteAgo = DateTime.Now.ToLocalTime().AddMinutes(-1).ToShortTimeString();
            actual.Time.Should().BeOneOf(aMinuteAgo, expected.Time);
        }

        public static void AssertAll(List<ChatMessage> expected, List<ChatMessage> actual)
        {
            foreach (var expectedMessage in expected)
            {
                var messageDisplayed = actual.Any(actualMessage => actualMessage.Message.Equals(expectedMessage.Message));
                messageDisplayed.Should().BeTrue($"'{expectedMessage}' message was not displayed.");
            }
        }
    }
}
