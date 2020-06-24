using FluentAssertions;
using NUnit.Framework;
using System.Collections.Generic;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Mappings
{
    public class CourtRoomsAccountResponseMapperTest
    {
        [Test]
        public void Should_map_user_response_to_court_rooms_account()
        {
            var accounts = UserResponseBuilder.BuildData();
            var userNames = new List<string> { "Manual01", "Manual03" };
            var result = CourtRoomsAccountResponseMapper.MapUserToCourtRoomsAccount(accounts, userNames);

            result.Should().NotBeNull();
            result.Count.Should().Be(2);
            result[0].CourtRooms.Count.Should().Be(3);
            result[1].CourtRooms.Count.Should().Be(1);

            result[0].Venue.Should().Be("Manual01");
            result[1].Venue.Should().Be("Manual03");

            result[0].CourtRooms[0].Should().Be("Court room 01");
            result[0].CourtRooms[1].Should().Be("Court room 02");
            result[0].CourtRooms[2].Should().Be("Court room 03");

            result[1].CourtRooms[0].Should().Be("Court room 01");

        }
    }
}
