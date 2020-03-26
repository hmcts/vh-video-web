using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Mappings
{
    public class ParticipantForJudgeResponseMapperTests
    {
        [Test]
        public void Should_map_all_participants()
        {
            var participant = Builder<ParticipantSummaryResponse>.CreateNew().Build();

            var response = ParticipantForJudgeResponseMapper.MapParticipantSummaryToModel(participant);

            response.DisplayName.Should().BeEquivalentTo(participant.Display_name);
            response.Role.Should().BeEquivalentTo(participant.User_role);
            response.Representee.Should().BeEquivalentTo(participant.Representee);
            response.CaseTypeGroup.Should().BeEquivalentTo(participant.Case_group);
        }
    }
}
