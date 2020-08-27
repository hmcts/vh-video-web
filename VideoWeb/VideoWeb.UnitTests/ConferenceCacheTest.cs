using System;
using System.Linq;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Services.Video;


namespace VideoWeb.UnitTests
{
    public class ConferenceCacheTest
    {
        private IMemoryCache _memoryCache;
        private ConferenceCache _conferenceCache;

        [SetUp]
        public void SetUp()
        {
            _memoryCache = GetCache();
            _conferenceCache = new ConferenceCache(_memoryCache);
        }

        [Test]
        public async Task Should_add_conference_to_cache()
        {
            var conference = CreateConferenceResponse();
            await _conferenceCache.AddConferenceAsync(conference);
            _memoryCache.Get(conference.Id).Should().NotBeNull();
        }

        [Test]
        public async Task GetOrAddConferenceAsync_should_return_conference_when_cache_contains_key()
        {
            var conference = new Conference { Id = Guid.NewGuid() };

            _memoryCache.Set(conference.Id, conference);
            var result = await _conferenceCache.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>());

            result.Should().NotBeNull();
            result.Id.Should().Be(conference.Id);
        }
        
        [Test]
        public async Task GetOrAddConferenceAsync_should_return_conference_when_cache_does_not_contains_key()
        {
            var conferenceDetails = CreateConferenceResponse();
            conferenceDetails.Id = Guid.NewGuid();

            var result = await _conferenceCache.GetOrAddConferenceAsync(conferenceDetails.Id, () =>
            {
                _memoryCache.Set(conferenceDetails.Id, new Conference{ Id = conferenceDetails.Id });
                return Task.FromResult(conferenceDetails);
            });

            result.Should().NotBeNull();
            result.Id.Should().Be(conferenceDetails.Id);
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

        private static IMemoryCache GetCache()
        {
            var services = new ServiceCollection();
            services.AddMemoryCache();
            var serviceProvider = services.BuildServiceProvider();

            var memoryCache = serviceProvider.GetService<IMemoryCache>();
            return memoryCache;
        }

    }
}
