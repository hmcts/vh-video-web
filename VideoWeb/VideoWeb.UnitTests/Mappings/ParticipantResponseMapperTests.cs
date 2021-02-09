using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;
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
            response.DisplayName.Should().Be(participant.Display_name);
            response.Role.Should().Be(expectedRole);
            response.CaseTypeGroup.Should().Be(participant.Case_type_group);
            response.Representee.Should().Be(participant.Representee);
            response.FirstName.Should().Be(participant.First_name);
            response.LastName.Should().Be(participant.Last_name);
            response.HearingRole.Should().Be(participant.Hearing_role);
        }
    }
}
