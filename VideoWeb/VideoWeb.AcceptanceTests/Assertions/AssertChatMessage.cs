using System;
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
    }
}
