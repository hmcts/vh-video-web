using System.Text;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.Extensions.Caching.Distributed;
using Moq;
using Newtonsoft.Json;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using System.Threading;

namespace VideoWeb.UnitTests
{
    public class DistributedUserCacheTests
    {
        private Mock<IDistributedCache> _distributedCacheMock;
        
        [SetUp]
        public void Setup()
        {
            _distributedCacheMock = new Mock<IDistributedCache>();
        }

        [Test]
        public async Task Should_return_profile_if_in_cache()
        {
            var profile = Builder<UserProfile>.CreateNew().Build();
            var serialized = JsonConvert.SerializeObject(profile, SerializerSettings);
            var rawData = Encoding.UTF8.GetBytes(serialized);
            _distributedCacheMock.Setup(x => x.GetAsync(profile.UserName, CancellationToken.None)).ReturnsAsync(rawData);

            var cache = new DistributedUserProfileCache(_distributedCacheMock.Object);
            var result = await cache.GetOrAddAsync(profile.UserName, profile);
            result.Should().BeEquivalentTo(profile);
        }
        
        [Test]
        public async Task Should_call_function_and_add_to_cache_when_cache_empty()
        {
            var profile = Builder<UserProfile>.CreateNew().Build();
            var cache = new DistributedUserProfileCache(_distributedCacheMock.Object);

            var result = await cache.GetOrAddAsync(profile.UserName, profile);
            result.Should().BeEquivalentTo(profile);
        }
        
        [Test]
        public async Task Should_call_function_and_add_to_cache_when_cache_contains_unexpected_data()
        {
            var profile = Builder<UserProfile>.CreateNew().Build();
            var conferenceResponse = Builder<Conference>.CreateNew().Build();
            var serialisedConference = JsonConvert.SerializeObject(conferenceResponse, SerializerSettings);
            var rawData = Encoding.UTF8.GetBytes(serialisedConference);
            _distributedCacheMock.Setup(x => x.Get(profile.UserName)).Returns(rawData);
            var cache = new DistributedUserProfileCache(_distributedCacheMock.Object);
                     
            var result = await cache.GetOrAddAsync(profile.UserName, profile);
            result.Should().BeEquivalentTo(profile);
        }

        private static JsonSerializerSettings SerializerSettings => new JsonSerializerSettings
        {
            TypeNameHandling = TypeNameHandling.Objects, Formatting = Formatting.None
        };
    }
}
