using FluentAssertions;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Mappings
{
    class LinkedParticipantRequestToLinkedParticipantMapperTests : BaseMockerSutTestSetup<LinkedParticipantRequestToLinkedParticipantMapper>
    {
        private readonly LinkedParticipantRequest request = new LinkedParticipantRequest()
        {
            LinkedRefId = Guid.NewGuid(),
            ParticipantRefId = Guid.NewGuid(),
            Type = LinkedParticipantType.Interpreter
        };

        [Test]
        public void When_does_not_match_existing_user_Should_map_all_properties_with_ref_id()
        {
            var existingParticipants = new List<Participant>();

            var linkedParticipant = _sut.Map(request, existingParticipants);

            linkedParticipant.LinkedId.Should().Be(request.LinkedRefId);
            linkedParticipant.LinkType.ToString().Should().Be(request.Type.ToString());
        }

        [Test]
        public void When_does_match_existing_user_Should_map_all_properties_with_ref_id()
        {
            var matchingParticipant = new Participant()
            {
                RefId = request.LinkedRefId,
                Id = Guid.NewGuid(),
            };
            var existingParticipants = new List<Participant>() { matchingParticipant };

            var linkedParticipant = _sut.Map(request, existingParticipants);

            linkedParticipant.LinkedId.Should().Be(matchingParticipant.Id);
            linkedParticipant.LinkType.ToString().Should().Be(request.Type.ToString());
        }
    }
}
