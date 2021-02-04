using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Mappings
{
    public class EventTypeReasonMapperTest : BaseMockerSutTestSetup<EventTypeReasonMapper>
    {
        [Test]
        public void Should_set_reason_for_event_type_joined()
        {
            var eventType = EventType.ParticipantJoining;
            _sut.Map(eventType).Should().Be("participant joining");
        }
        [Test]
        public void Should_set_reason_to_empty()
        {
            var eventType = EventType.None;
            _sut.Map(eventType).Should().Be(string.Empty);
        }
        [Test]
        public void Should_set_reason_to_participant_not_signed_in()
        {
            var eventType = EventType.ParticipantNotSignedIn;
            _sut.Map(eventType).Should().Be("participant not signed in");
        }

    }
}
