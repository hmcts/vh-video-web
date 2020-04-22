using System;
using System.Linq;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
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
            await _conferenceCache.AddConferenceToCacheAsync(conference);
            _memoryCache.Get(conference.Id).Should().NotBeNull();
        }

        [Test]
        public async Task Should_get_conference_from_cache()
        {
            var conference = new Conference
            {
                Id = Guid.NewGuid()
            };

            _memoryCache.Set(conference.Id, conference);
            var result = await _conferenceCache.GetConferenceAsync(conference.Id);

            result.Should().NotBeNull();
            result.Id.Should().Be(conference.Id);
        }

        private static ConferenceDetailsResponse CreateConferenceResponse()
        {
            var participants = Builder<ParticipantDetailsResponse>.CreateListOfSize(2).Build().ToList();

            var conference = Builder<ConferenceDetailsResponse>.CreateNew()
                .With(x => x.Participants = participants)
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
