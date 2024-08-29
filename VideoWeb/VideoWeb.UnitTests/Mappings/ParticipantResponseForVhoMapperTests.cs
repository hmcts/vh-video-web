using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;
using ParticipantStatus = VideoWeb.Common.Models.ParticipantStatus;

namespace VideoWeb.UnitTests.Mappings;

public class ParticipantResponseForVhoMapperTests
{
    [Test]
    public void Should_map_all_properties()
    {
        const ParticipantStatus expectedStatus = ParticipantStatus.Available;
        const Role expectedRole = Role.Individual;
        var participant = new ParticipantBuilder(Role.Individual).WithStatus(ParticipantStatus.Available).Build();
        
        var response = ParticipantResponseForVhoMapper.Map(participant);
        response.Id.Should().Be(participant.Id);
        response.Status.Should().Be(expectedStatus);
        response.DisplayName.Should().Be(participant.DisplayName);
        response.Role.Should().Be(expectedRole);
        response.LinkedParticipants.Count.Should().Be(1);
        
        var actualLp = response.LinkedParticipants[0];
        actualLp.LinkedId.Should().Be(participant.LinkedParticipants[0].LinkedId);
        actualLp.LinkType.Should().Be(participant.LinkedParticipants[0].LinkType);
    }
}
