using FluentAssertions;
using NUnit.Framework;
using VideoApi.Contract.Enums;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;
using VHEndpointStatus = VideoWeb.Common.Models.EndpointStatus;

namespace VideoWeb.UnitTests.Mappings
{
    public class EndpointsResponseMapperTest : BaseMockerSutTestSetup<EndpointsResponseMapper>
    {
        [TestCase(EndpointState.Connected, VHEndpointStatus.Connected)]
        [TestCase(EndpointState.Disconnected, VHEndpointStatus.Disconnected)]
        [TestCase(EndpointState.InConsultation, VHEndpointStatus.InConsultation)]
        [TestCase(EndpointState.NotYetJoined, VHEndpointStatus.NotYetJoined)]
        public void Should_map_user_response_to_court_rooms_account(EndpointState apiState, VHEndpointStatus expected)
        {
            var endpoint = new EndpointsResponseBuilder().WithStatus(apiState).Build();
            var result = _sut.Map(endpoint, 1);

            result.Should().NotBeNull();
            result.DisplayName.Should().Be(endpoint.DisplayName);
            result.Id.Should().Be(endpoint.Id);
            result.Status.ToString().Should().Be(endpoint.Status.ToString());
            result.DefenceAdvocateUsername.Should().Be(endpoint.DefenceAdvocate);
            result.PexipDisplayName.Should().Be($"PSTN;{endpoint.DisplayName};{endpoint.Id}");
        }
    }
}
