using System;
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
            cachedModel.DefenceAdvocateUsername.Should().Be(ep.Defence_advocate.ToLower());
        }

        [Test]
        public void should_map_endpoint_to_cache_model_with_lower_trimmed_defence_advocate_username()
        {
            var ep = new EndpointResponse
            {
                Id = Guid.NewGuid(), Display_name = "my name", Pin = "1234", Sip_address = "sip@sip.com",
                Status = EndpointState.Connected, Defence_advocate = " ALLUPPER "
            };
            
            var cachedModel = EndpointCacheMapper.MapEndpointToCacheModel(ep);

            cachedModel.Id.Should().Be(ep.Id);
            cachedModel.DisplayName.Should().Be(ep.Display_name);
            cachedModel.EndpointStatus.ToString().Should().Be(ep.Status.ToString());
            cachedModel.DefenceAdvocateUsername.Should().Be(ep.Defence_advocate.ToLower().Trim());
        }

        [Test]
        public void should_map_endpoint_to_cache_model_with_null_defence_advocate_username()
        {
            var ep = new EndpointResponse
            {
                Id = Guid.NewGuid(), Display_name = "my name", Pin = "1234", Sip_address = "sip@sip.com",
                Status = EndpointState.Connected
            };

            var cachedModel = EndpointCacheMapper.MapEndpointToCacheModel(ep);

            cachedModel.Id.Should().Be(ep.Id);
            cachedModel.DisplayName.Should().Be(ep.Display_name);
            cachedModel.EndpointStatus.ToString().Should().Be(ep.Status.ToString());
            cachedModel.DefenceAdvocateUsername.Should().BeNull();
        }

        [Test]
        public void should_map_endpoint_to_cache_model_with_empty_defence_advocate_username()
        {
            var ep = new EndpointResponse
            {
                Id = Guid.NewGuid(), Display_name = "my name", Pin = "1234", Sip_address = "sip@sip.com",
                Status = EndpointState.Connected, Defence_advocate = "  "
            };

            var cachedModel = EndpointCacheMapper.MapEndpointToCacheModel(ep);

            cachedModel.Id.Should().Be(ep.Id);
            cachedModel.DisplayName.Should().Be(ep.Display_name);
            cachedModel.EndpointStatus.ToString().Should().Be(ep.Status.ToString());
            cachedModel.DefenceAdvocateUsername.Should().BeEmpty();
        }
    }
}
