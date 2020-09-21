using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using VideoWeb.AcceptanceTests.Helpers;
using TimeZone = AcceptanceTests.Common.Data.Time.TimeZone;

namespace VideoWeb.AcceptanceTests.Assertions
{
    public static class AssertChatMessage
    {
        public static void Assert(ChatMessage expected, ChatMessage actual, TimeZone timeZone)
        {
            actual.Message.Should().Be(expected.Message);
            actual.Sender.Should().Be(expected.Sender);
            var oneMinuteBefore = timeZone.Adjust(DateTime.Now).AddMinutes(-1);
            var oneMinuteAfter = timeZone.Adjust(DateTime.Now).AddMinutes(1);
            actual.Time.Should().BeOneOf(oneMinuteBefore.ToShortTimeString(), AddTolerance(oneMinuteBefore, expected.Time), oneMinuteAfter.ToShortTimeString());
        }

        private static string AddTolerance(DateTime oneMinuteBefore, string expectedTime)
        {
            return oneMinuteBefore.ToShortTimeString().Equals(expectedTime) ? oneMinuteBefore.AddMinutes(1).ToShortTimeString() : expectedTime;
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
