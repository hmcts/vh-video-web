using FluentAssertions;
using NUnit.Framework;
using VideoApi.Contract.Enums;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;
using VHEndpointStatus = VideoWeb.Common.Models.EndpointStatus;

namespace VideoWeb.UnitTests.Mappings;

public class VideoEndpointsResponseMapperTest
{
    [TestCase(EndpointState.Connected, VHEndpointStatus.Connected)]
    [TestCase(EndpointState.Disconnected, VHEndpointStatus.Disconnected)]
    [TestCase(EndpointState.InConsultation, VHEndpointStatus.InConsultation)]
    [TestCase(EndpointState.NotYetJoined, VHEndpointStatus.NotYetJoined)]
    public void Should_map_user_response_to_court_rooms_account(EndpointState apiState, VHEndpointStatus expected)
    {
        var defenceAdvocate = "DefenceAdvocate";
        var endpointBuilder = new EndpointsResponseBuilder();
        var endpoint = endpointBuilder.WithStatus(apiState).Build();
        endpoint.DefenceAdvocate = defenceAdvocate;
        var result = VideoEndpointsResponseMapper.Map(endpoint);
        
        result.Should().NotBeNull();
        result.DisplayName.Should().Be(endpoint.DisplayName);
        result.Id.Should().Be(endpoint.Id);
        result.Status.ToString().Should().Be(endpoint.Status.ToString());
        result.DefenceAdvocateUsername.Should().Be(defenceAdvocate);
        result.PexipDisplayName.Should().Be($"PSTN;{endpoint.DisplayName};{endpoint.Id}");
    }
}
