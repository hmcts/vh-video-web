using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Mappings
{
    public class EndpointsResponseMapperTest
    {
        [Test]
        public void Should_map_user_response_to_court_rooms_account()
        {
            var builder = new EndpointsResponseBuilder();
            var endpoint = builder.Build();
            var result = EndpointsResponseMapper.Map(endpoint);

            result.Should().NotBeNull();
            result.DisplayName.Should().Be(endpoint.Display_name);
            result.Id.Should().Be(endpoint.Id);
            result.Pin.Should().Be(endpoint.Pin);
            result.SipAddress.Should().Be(endpoint.Sip_address);
            result.Status.ToString().Should().Be(endpoint.Status.ToString());
        }
    }
}
