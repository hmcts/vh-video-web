using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Mappings
{
    public class CourtRoomsAccountResponseMapperTest : BaseMockerSutTestSetup<CourtRoomsAccountResponseMapper>
    {
        [Test]
        public void Should_map_user_response_to_court_rooms_account()
        {
            var conferences = ConferenceForVhOfficerResponseBuilder.BuildData();
            var result = _sut.Map(conferences);

            result.Should().NotBeNull();
            result.Count.Should().Be(2);
            result[0].Judges.Count.Should().Be(3);
            result[1].Judges.Count.Should().Be(1);

            result[0].VenueName.Should().Be("Venue Name 01");
            result[1].VenueName.Should().Be("Venue Name 02");

            result[0].Judges[0].Should().Be("Alpha");
            result[0].Judges[1].Should().Be("Beta");
            result[0].Judges[2].Should().Be("Gamma");

            result[1].Judges[0].Should().Be("Gamma");

        }
        
        [Test]
        public void Should_map_user_response_to_court_rooms_account_but_exclude_hearings_without_judge()
        {
            var conferences = ConferenceForVhOfficerResponseBuilder.BuildData();
            conferences.ForEach(e => e.Participants.RemoveAll(x => x.Role == Role.Judge) );
            conferences[0].Participants.Add(new ParticipantForUserResponse
                {
                    Role = Role.Judge,
                    HearingRole = "Judge", 
                    FirstName = "JudgeFName", 
                    LastName = "JudgeLName"
                });
            var result = _sut.Map(conferences);

            result.Should().NotBeNull();
            result.Count.Should().Be(1);
        }
    }
}
