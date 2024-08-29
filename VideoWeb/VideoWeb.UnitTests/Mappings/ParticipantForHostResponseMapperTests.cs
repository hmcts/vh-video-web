using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Mappings;

public class ParticipantForHostResponseMapperTests
{
    [Test]
    public void Should_map_all_participants()
    {
        var participant = Builder<ParticipantCoreResponse>.CreateNew().Build();
        
        var response = ParticipantForHostResponseMapper.Map(participant);
        
        response.DisplayName.Should().BeEquivalentTo(participant.DisplayName);
        response.Role.Should().Be((Role)participant.UserRole);
    }
}
