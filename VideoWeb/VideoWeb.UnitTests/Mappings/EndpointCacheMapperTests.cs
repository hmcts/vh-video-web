using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoApi.Contract.Responses;

namespace VideoWeb.UnitTests.Mappings
{
    public class EndpointCacheMapperTests
    {
        [Test]
        public void should_map_endpoint_to_cache_model()
        {
            var ep = Builder<EndpointResponse>.CreateNew()
                .With(e => e.CurrentRoom = Builder<RoomResponse>.CreateNew()
                    .With(r => r.Id = 1)
                    .Build())
                .Build();
            var cachedModel = EndpointCacheMapper.MapEndpointToCacheModel(ep);

            cachedModel.Id.Should().Be(ep.Id);
            cachedModel.DisplayName.Should().Be(ep.DisplayName);
            cachedModel.EndpointStatus.ToString().Should().Be(ep.Status.ToString());
            cachedModel.DefenceAdvocateUsername.Should().Be(ep.DefenceAdvocate);
            cachedModel.CurrentRoom.Id.Should().Be(ep.CurrentRoom.Id);
            cachedModel.CurrentRoom.Label.Should().Be(ep.CurrentRoom.Label);
            cachedModel.CurrentRoom.Locked.Should().Be(ep.CurrentRoom.Locked);
        }
    }
}
