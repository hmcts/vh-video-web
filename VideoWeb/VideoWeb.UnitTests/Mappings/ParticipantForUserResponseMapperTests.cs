using System.Linq;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Mappings
{
    public class ParticipantForUserResponseMapperTests
    {
        private readonly ParticipantForUserResponseMapper _mapper = new ParticipantForUserResponseMapper();
        [Test]
        public void Should_map_all_participants()
        {
            var participants = Builder<ParticipantSummaryResponse>.CreateListOfSize(2).Build().ToList();

            var response = _mapper.MapParticipants(participants);

            for (var index = 0; index < participants.Count; index++)
            {
                var participant = participants[index];
                response[index].Username.Should().BeEquivalentTo(participant.Username);
                response[index].DisplayName.Should().BeEquivalentTo(participant.Display_name);
                response[index].Role.Should().BeEquivalentTo(participant.User_role);
                response[index].Status.ToString().Should().BeEquivalentTo(participant.Status.ToString());
                response[index].Representee.Should().BeEquivalentTo(participant.Representee);
                response[index].CaseTypeGroup.Should().BeEquivalentTo(participant.Case_group);
            }
        }
    }
}
