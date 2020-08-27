using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Mappings
{
    public class EndpointCacheMapperTests
    {
        [Test]
        public void should_map_endpoint_to_cache_model()
        {
            var ep = Builder<EndpointResponse>.CreateNew().Build();
            var cachedModel = EndpointCacheMapper.MapEndpointToCacheModel(ep);

            cachedModel.Id.Should().Be(ep.Id);
            cachedModel.DisplayName.Should().Be(ep.Display_name);
            cachedModel.EndpointStatus.ToString().Should().Be(ep.Status.ToString());

        }
    }
}
