using System;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.Extensions.Caching.Distributed;
using Moq;
using Newtonsoft.Json;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests
{
    public class DistributedConferenceCacheTests
    {
        private Mock<IDistributedCache> _distributedCacheMock;

        [SetUp]
        public void Setup()
        {
            _distributedCacheMock = new Mock<IDistributedCache>();
        }

        [Test]
        public async Task should_return_conference_when_cache_contains_key()
        {
            var conferenceResponse = CreateConferenceResponse();
            var conference = ConferenceCacheMapper.MapConferenceToCacheModel(conferenceResponse);
            var serialisedConference = JsonConvert.SerializeObject(conference, SerializerSettings);
            var rawData = Encoding.UTF8.GetBytes(serialisedConference);
            _distributedCacheMock
                .Setup(x => x.GetAsync(conference.Id.ToString(), CancellationToken.None))
                .ReturnsAsync(rawData);

            var cache = new DistributedConferenceCache(_distributedCacheMock.Object);

            var result = await cache.GetConferenceAsync(conference.Id);
            result.Should().BeEquivalentTo(conference);
        }
        
        [Test]
        public async Task should_return_null_when_cache_contains_unexpected_data()
        {
            var conferenceResponse = CreateConferenceResponse();
            var serialisedConference = JsonConvert.SerializeObject(conferenceResponse, SerializerSettings);
            var rawData = Encoding.UTF8.GetBytes(serialisedConference);
            _distributedCacheMock.Setup(x => x.Get(It.IsAny<string>())).Returns(rawData);

            var cache = new DistributedConferenceCache(_distributedCacheMock.Object);

            var result = await cache.GetConferenceAsync(conferenceResponse.Id);
            result.Should().BeNull();

        }

        [Test]
        public async Task should_return_null_when_cache_is_empty()
        {
            var conferenceId = Guid.NewGuid();
            _distributedCacheMock.Setup(x => x.Get(It.IsAny<string>())).Returns((byte[]) null);

            var cache = new DistributedConferenceCache(_distributedCacheMock.Object);

            var result = await cache.GetConferenceAsync(conferenceId);
            result.Should().BeNull();

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

            var cache = new DistributedConferenceCache(_distributedCacheMock.Object);

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

            var cache = new DistributedConferenceCache(_distributedCacheMock.Object);

            var result = await cache.GetOrAddConferenceAsync(conference.Id, async () => await Task.FromResult(conferenceResponse));
            result.Should().BeEquivalentTo(conference);
        }

        private static ConferenceDetailsResponse CreateConferenceResponse()
        {
            var participants = Builder<ParticipantDetailsResponse>.CreateListOfSize(2).Build().ToList();

            var conference = Builder<ConferenceDetailsResponse>.CreateNew()
                .With(x => x.Participants = participants)
                .Build();
            return conference;
        }
        
        private static JsonSerializerSettings SerializerSettings => new JsonSerializerSettings
        {
            TypeNameHandling = TypeNameHandling.Objects, Formatting = Formatting.None
        };
    }
}
