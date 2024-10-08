using FluentAssertions;
using NUnit.Framework;
using VideoApi.Contract.Enums;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Mappings;

public class EventTypeReasonMapperTest
{
    [Test]
    public void Should_set_reason_for_event_type_joined()
    {
        var eventType = EventType.ParticipantJoining;
        EventTypeReasonMapper.Map(eventType).Should().Be("participant joining");
    }
    [Test]
    public void Should_set_reason_to_empty()
    {
        var eventType = EventType.None;
        EventTypeReasonMapper.Map(eventType).Should().Be(string.Empty);
    }
    [Test]
    public void Should_set_reason_to_participant_not_signed_in()
    {
        var eventType = EventType.ParticipantNotSignedIn;
        EventTypeReasonMapper.Map(eventType).Should().Be("participant not signed in");
    }
    
}
