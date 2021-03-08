using FluentAssertions;
using NUnit.Framework;
using VideoApi.Contract.Enums;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;
using ParticipantStatus = VideoWeb.Common.Models.ParticipantStatus;

namespace VideoWeb.UnitTests.Mappings
{
    public class ParticipantResponseMapperTests : BaseMockerSutTestSetup<ParticipantResponseMapper>
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
            response.FirstName.Should().Be(participant.FirstName);
            response.LastName.Should().Be(participant.LastName);
            response.HearingRole.Should().Be(participant.HearingRole);
        }
    }
}
