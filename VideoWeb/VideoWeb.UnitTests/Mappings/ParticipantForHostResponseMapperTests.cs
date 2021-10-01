using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Mappings;
using Participant = VideoApi.Contract.Responses.ParticipantForHostResponse;

namespace VideoWeb.UnitTests.Mappings
{
    public class ParticipantForHostResponseMapperTests : BaseMockerSutTestSetup<ParticipantForHostResponseMapper>
    {
        [Test]
        public void Should_map_all_participants()
        {
            var participant = Builder<Participant>.CreateNew().Build();

            var response = _sut.Map(participant);

            response.DisplayName.Should().BeEquivalentTo(participant.DisplayName);
            response.Role.Should().BeEquivalentTo(participant.Role);
            response.Representee.Should().BeEquivalentTo(participant.Representee);
            response.CaseTypeGroup.Should().BeEquivalentTo(participant.CaseTypeGroup);
            response.HearingRole.Should().BeEquivalentTo(participant.HearingRole);
        }
    }
}
