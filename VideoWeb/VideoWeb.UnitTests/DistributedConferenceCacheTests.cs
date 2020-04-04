using System;
using System.Linq;
using System.Text;
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
        public void should_return_conference_when_cache_contains_key()
        {
            var conferenceResponse = CreateConferenceResponse();
            var conference = ConferenceCacheMapper.MapConferenceToCacheModel(conferenceResponse);
            var serialisedConference = JsonConvert.SerializeObject(conference, SerializerSettings);
            var rawData = Encoding.UTF8.GetBytes(serialisedConference);
            _distributedCacheMock.Setup(x => x.Get(It.IsAny<string>())).Returns(rawData);

            var cache = new DistributedConferenceCache(_distributedCacheMock.Object);

            var result = cache.GetConference(conference.Id);
            result.Should().BeEquivalentTo(conference);
        }
        
        [Test]
        public void should_return_null_when_cache_contains_unexpected_data()
        {
            var conferenceResponse = CreateConferenceResponse();
            var serialisedConference = JsonConvert.SerializeObject(conferenceResponse, SerializerSettings);
            var rawData = Encoding.UTF8.GetBytes(serialisedConference);
            _distributedCacheMock.Setup(x => x.Get(It.IsAny<string>())).Returns(rawData);

            var cache = new DistributedConferenceCache(_distributedCacheMock.Object);

            var result = cache.GetConference(conferenceResponse.Id);
            result.Should().BeNull();

        }

        [Test]
        public void should_return_null_when_cache_is_empty()
        {
            var conferenceId = Guid.NewGuid();
            _distributedCacheMock.Setup(x => x.Get(It.IsAny<string>())).Returns((byte[]) null);

            var cache = new DistributedConferenceCache(_distributedCacheMock.Object);

            var result = cache.GetConference(conferenceId);
            result.Should().BeNull();

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
