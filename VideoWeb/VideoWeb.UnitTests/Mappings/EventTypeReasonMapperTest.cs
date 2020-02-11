using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Mappings
{
    public class EventTypeReasonMapperTest
    {
        [Test]
        public void Should_set_reason_for_event_type_joined()
        {
            var eventType = EventType.ParticipantJoining
            EventTypeReasonMapper.Map(eventType).Should().Be("participant joining");
        }
        [Test]
        public void Should_set_reason_for_event_type_judge_available()
        {
            var eventType = EventType.JudgeAvailable;
            EventTypeReasonMapper.Map(eventType).Should().Be("judge available");
        }
        [Test]
        public void Should_set_reason_for_event_type_judge_unavailable()
        {
            var eventType = EventType.JudgeUnavailable;
            EventTypeReasonMapper.Map(eventType).Should().Be("judge unavailable");
        }
    }
}
