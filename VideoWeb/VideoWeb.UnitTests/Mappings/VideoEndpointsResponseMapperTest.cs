using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;
using VHEndpointStatus = VideoWeb.Common.Models.EndpointStatus;

namespace VideoWeb.UnitTests.Mappings;

public class VideoEndpointsResponseMapperTest
{
    [Test]
    public void should_map_EndpointDto_to_response()
    {
        var endpoint = new EndpointsBuilder()
            .WithCurrentRoom()
            .WithStatus(VHEndpointStatus.Connected)
            .Build();
        endpoint.ParticipantsLinked.Add("Defence Advocate");
        
        var result = VideoEndpointsResponseMapper.Map(endpoint);
        
        result.Should().NotBeNull();
        result.DisplayName.Should().Be(endpoint.DisplayName);
        result.Id.Should().Be(endpoint.Id);
        result.Status.Should().Be(VHEndpointStatus.Connected);
        result.ParticipantsLinked.Should().Contain("Defence Advocate");
        result.PexipDisplayName.Should().Be($"PSTN;{endpoint.DisplayName};{endpoint.Id}");
    }
}
