using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Mappings;
using Participant = VideoWeb.Services.Video.ParticipantForJudgeResponse;

namespace VideoWeb.UnitTests.Mappings
{
    public class ParticipantForJudgeResponseMapperTests
    {
        [Test]
        public void Should_map_all_participants()
        {
            var participant = Builder<Participant>.CreateNew().Build();

            var response = ParticipantForJudgeResponseMapper.MapParticipantSummaryToModel(participant);

            response.DisplayName.Should().BeEquivalentTo(participant.Display_name);
            response.Role.Should().BeEquivalentTo(participant.Role);
            response.Representee.Should().BeEquivalentTo(participant.Representee);
            response.CaseTypeGroup.Should().BeEquivalentTo(participant.Case_type_group);
        }
    }
}
