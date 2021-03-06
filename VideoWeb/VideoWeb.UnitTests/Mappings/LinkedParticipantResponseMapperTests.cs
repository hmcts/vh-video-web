using System;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Mappings;
using VHLinkedParticipantResponse = VideoWeb.Services.Video.LinkedParticipantResponse;

namespace VideoWeb.UnitTests.Mappings
{
    public class LinkedParticipantResponseMapperTests : BaseMockerSutTestSetup<LinkedParticipantResponseMapper>
    {
        [Test]
        public void Should_map_all_properties()
        {
            var linkedParticipant = new VHLinkedParticipantResponse
            {
                Linked_id = Guid.NewGuid(),
                Type = LinkedParticipantType.Interpreter
            };
            
            var response = _sut.Map(linkedParticipant);

            response.LinkedId.Should().Be(linkedParticipant.Linked_id);
            response.LinkType.ToString().Should().Be(linkedParticipant.Type.ToString());
        }
    }
}
