using FluentAssertions;
using NUnit.Framework;
using VideoApi.Contract.Enums;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;
using VHEndpointStatus = VideoWeb.Common.Models.EndpointStatus;

namespace VideoWeb.UnitTests.Mappings
{
    public class EndpointsMapperTest : BaseMockerSutTestSetup<EndpointsMapper>
    {
        [TestCase(EndpointState.Connected, VHEndpointStatus.Connected)]
        [TestCase(EndpointState.Disconnected, VHEndpointStatus.Disconnected)]
        [TestCase(EndpointState.InConsultation, VHEndpointStatus.InConsultation)]
        [TestCase(EndpointState.NotYetJoined, VHEndpointStatus.NotYetJoined)]
        public void Should_map_user_response_to_court_rooms_account(EndpointState apiState, VHEndpointStatus expected)
        {
            var endpoint = new EndpointsBuilder().WithStatus(apiState).Build();
            var result = _sut.Map(endpoint);
            
            result.Should().NotBeNull();
            result.DisplayName.Should().Be(endpoint.DisplayName);
            result.Id.Should().Be(endpoint.Id);
            result.EndpointStatus.ToString().Should().Be(endpoint.Status.ToString());
            result.DefenceAdvocateUsername.Should().Be(endpoint.DefenceAdvocate);
            result.DisplayName.Should().Be(endpoint.DisplayName);
        }
    }
}
