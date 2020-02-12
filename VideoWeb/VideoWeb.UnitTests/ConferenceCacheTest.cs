using System;
using System.Linq;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using NUnit.Framework;
using VideoWeb.Services.Video;


namespace VideoWeb.UnitTests
{
       public class ConferenceCacheTest
    {
        private  IMemoryCache _memoryCache;
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
            await _conferenceCache.AddConferenceToCache(conference);
            _memoryCache.Get(conference.Id).Should().NotBeNull();
        }
        
        private ConferenceDetailsResponse CreateConferenceResponse()
        {
            var participants = Builder<ParticipantDetailsResponse>.CreateListOfSize(2).Build().ToList();
          
            var conference = Builder<ConferenceDetailsResponse>.CreateNew()
                .With(x => x.Participants = participants)
                .Build();
            return conference;
        }

        private IMemoryCache GetCache()
        {
            var services = new ServiceCollection();
            services.AddMemoryCache();
            var serviceProvider = services.BuildServiceProvider();

            var memoryCache = serviceProvider.GetService<IMemoryCache>();
            return memoryCache;
        }

    }
}
