using System;
using FluentAssertions;
using NUnit.Framework;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Mappings
{
    public class LinkedParticipantResponseMapperTests : BaseMockerSutTestSetup<LinkedParticipantResponseMapper>
    {
        [Test]
        public void Should_map_all_properties()
        {
            var linkedParticipant = new LinkedParticipantResponse
            {
                LinkedId = Guid.NewGuid(),
                Type = LinkedParticipantType.Interpreter
            };
            
            var response = _sut.Map(linkedParticipant);

            response.LinkedId.Should().Be(linkedParticipant.LinkedId);
            response.LinkType.ToString().Should().Be(linkedParticipant.Type.ToString());
        }
    }
}
