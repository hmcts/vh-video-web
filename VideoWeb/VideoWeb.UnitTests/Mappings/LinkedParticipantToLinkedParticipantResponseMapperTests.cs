using FluentAssertions;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Text;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Mappings
{
    class LinkedParticipantToLinkedParticipantResponseMapperTests : BaseMockerSutTestSetup<LinkedParticipantToLinkedParticipantResponseMapper>
    {
        [Test]
        public void Should_map_correctly()
        {
            var testLinkedParticipant = new LinkedParticipant()
            {
                LinkedId = Guid.NewGuid(),
                LinkType = LinkType.Interpreter
            };

            var mapped = _sut.Map(testLinkedParticipant);

            mapped.LinkedId.Should().Be(testLinkedParticipant.LinkedId);
            mapped.LinkType.Should().Be(testLinkedParticipant.LinkType);
        }
    }
}
