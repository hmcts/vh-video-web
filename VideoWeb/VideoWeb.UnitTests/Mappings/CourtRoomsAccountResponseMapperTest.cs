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
            var conferences = ConferenceForAdminResponseBuilder.BuildData();
            var result = _sut.Map(conferences);

            result.Should().NotBeNull();
            result.Count.Should().Be(2);
            result[0].LastNames.Count.Should().Be(3);
            result[1].LastNames.Count.Should().Be(1);

            result[0].FirstName.Should().Be("FirstName1");
            result[1].FirstName.Should().Be("FirstName4");

            result[0].LastNames[0].Should().Be("LastName1");
            result[0].LastNames[1].Should().Be("LastName2");
            result[0].LastNames[2].Should().Be("LastName3");

            result[1].LastNames[0].Should().Be("LastName4");

        }
    }
}
