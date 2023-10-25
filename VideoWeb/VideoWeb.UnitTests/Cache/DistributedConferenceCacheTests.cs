using System;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Moq;
using Newtonsoft.Json;
using NUnit.Framework;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;

namespace VideoWeb.UnitTests.Cache
{
    public class DistributedConferenceCacheTests
    {
        private Mock<IDistributedCache> _distributedCacheMock;
        private Mock<ILogger<RedisCacheBase<Guid, Conference>>> _loggerMock;

        [SetUp]
        public void Setup()
        {
            _distributedCacheMock = new Mock<IDistributedCache>();
            _loggerMock = new Mock<ILogger<RedisCacheBase<Guid, Conference>>>();
        }
        
        [Test]
        public async Task GetOrAddConferenceAsync_should_return_conference_when_cache_contains_key()
        {
            var conferenceResponse = CreateConferenceResponse();
            var conference = ConferenceCacheMapper.MapConferenceToCacheModel(conferenceResponse);
            var serialisedConference = JsonConvert.SerializeObject(conference, SerializerSettings);
            var rawData = Encoding.UTF8.GetBytes(serialisedConference);
            _distributedCacheMock
                .Setup(x => x.GetAsync(conference.Id.ToString(), CancellationToken.None))
                .ReturnsAsync(rawData);

            var cache = new DistributedConferenceCache(_distributedCacheMock.Object, _loggerMock.Object);

            var result = await cache.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>());
            result.Should().BeEquivalentTo(conference);
        }
        
        [Test]
        public async Task GetOrAddConferenceAsync_should_return_conference_when_cache_does_not_contains_key()
        {
            var conferenceResponse = CreateConferenceResponse();
            var conference = ConferenceCacheMapper.MapConferenceToCacheModel(conferenceResponse);
            var serialisedConference = JsonConvert.SerializeObject(conference, SerializerSettings);
            var rawData = Encoding.UTF8.GetBytes(serialisedConference);
            _distributedCacheMock
                .SetupSequence(x => x.GetAsync(conference.Id.ToString(), CancellationToken.None))
                .ReturnsAsync((byte[]) null)
                .ReturnsAsync(rawData);
            
            _distributedCacheMock
                .Setup(x => x.SetAsync(conference.Id.ToString(), rawData, It.IsAny<DistributedCacheEntryOptions>(), CancellationToken.None));

            var cache = new DistributedConferenceCache(_distributedCacheMock.Object, _loggerMock.Object);

            var result = await cache.GetOrAddConferenceAsync(conference.Id, async () => await Task.FromResult(conferenceResponse));
            result.Should().BeEquivalentTo(conference);
        }

        private static ConferenceDetailsResponse CreateConferenceResponse()
        {
            var participants = Builder<ParticipantDetailsResponse>.CreateListOfSize(2).Build().ToList();
            var endpoints = Builder<EndpointResponse>.CreateListOfSize(2).Build().ToList();
            var conference = Builder<ConferenceDetailsResponse>.CreateNew()
                .With(x => x.Participants = participants)
                .With(x => x.Endpoints = endpoints)
                .Build();
            return conference;
        }
        
        private static JsonSerializerSettings SerializerSettings => new JsonSerializerSettings
        {
            TypeNameHandling = TypeNameHandling.Objects, Formatting = Formatting.None
        };
    }
}
