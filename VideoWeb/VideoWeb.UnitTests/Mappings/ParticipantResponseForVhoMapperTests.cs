using FluentAssertions;
using NUnit.Framework;
using VideoApi.Contract.Enums;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;
using ParticipantStatus = VideoWeb.Common.Models.ParticipantStatus;

namespace VideoWeb.UnitTests.Mappings
{
    public class ParticipantResponseForVhoMapperTests : BaseMockerSutTestSetup<ParticipantResponseForVhoMapper>
    {
        [Test]
        public void Should_map_all_properties()
        {
            const ParticipantStatus expectedStatus = ParticipantStatus.Available;
            const Role expectedRole = Role.Individual;
            var participant = new ParticipantDetailsResponseBuilder(UserRole.Individual, "Claimant")
                .WithStatus(ParticipantState.Available).Build();

            var response = _sut.Map(participant);
            response.Id.Should().Be(participant.Id);
            response.Name.Should().Be(participant.Name);
            response.Status.Should().Be(expectedStatus);
            response.DisplayName.Should().Be(participant.DisplayName);
            response.Role.Should().Be(expectedRole);
            response.CaseTypeGroup.Should().Be(participant.CaseTypeGroup);
            response.Representee.Should().Be(participant.Representee);
            response.HearingRole.Should().Be(participant.HearingRole);
            response.LinkedParticipants.Count.Should().Be(1);
            response.LinkedParticipants[0].Should().Be(participant.LinkedParticipants[0]);
        }
    }
}
