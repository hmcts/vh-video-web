using FluentAssertions;
using NUnit.Framework;
using System.Collections.Generic;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Mappings
{
    public class CourtRoomsAccountResponseMapperTest : BaseMockerSutTestSetup<CourtRoomsAccountResponseMapper>
    {
        [Test]
        public void Should_map_user_response_to_court_rooms_account()
        {
            var conferences = ConferenceResponseBuilder.BuildData();
            var result = _sut.Map(conferences);

            result.Should().NotBeNull();
            result.Count.Should().Be(2);
            result[0].CourtRooms.Count.Should().Be(3);
            result[1].CourtRooms.Count.Should().Be(1);

            result[0].Venue.Should().Be("FirstName1");
            result[1].Venue.Should().Be("FirstName4");

            result[0].CourtRooms[0].Should().Be("LastName1");
            result[0].CourtRooms[1].Should().Be("LastName2");
            result[0].CourtRooms[2].Should().Be("LastName3");

            result[1].CourtRooms[0].Should().Be("LastName4");

        }
    }
}
