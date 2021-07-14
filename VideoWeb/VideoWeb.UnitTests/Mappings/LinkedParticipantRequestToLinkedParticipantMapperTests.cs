using FluentAssertions;
using NUnit.Framework;
using System;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Mappings
{
    class LinkedParticipantRequestToLinkedParticipantMapperTests : BaseMockerSutTestSetup<LinkedParticipantRequestToLinkedParticipantMapper>
    {
        [Test]
        public void Should_map_all_properties()
        {
            var request = new LinkedParticipantRequest
            {
                LinkedRefId = Guid.NewGuid(),
                ParticipantRefId = Guid.NewGuid(),
                Type = LinkedParticipantType.Interpreter
            };

            var linkedParticipant = _sut.Map(request);

            linkedParticipant.LinkedId.Should().Be(linkedParticipant.LinkedId);
            linkedParticipant.LinkType.ToString().Should().Be(linkedParticipant.LinkType.ToString());
        }
    }
}
