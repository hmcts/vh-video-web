using System;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;

namespace VideoWeb.UnitTests.Cache
{
    public class ConferenceCacheTest : CacheTestBase
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
            var hearingDetails = CreateHearingResponse();
            await _conferenceCache.AddConferenceAsync(conference, hearingDetails);
            _memoryCache.Get(conference.Id).Should().NotBeNull();
        }
        
        [Test]
        public async Task Should_update_conference_to_cache()
        {
            var newVenueName = "Updated Name for Test";
            var conference = CreateConferenceResponse();
            var hearingDetails = CreateHearingResponse();
            await _conferenceCache.AddConferenceAsync(conference, hearingDetails);
            var cacheModel = _memoryCache.Get(conference.Id).As<Conference>();
            cacheModel.HearingVenueName = newVenueName;
            await _conferenceCache.UpdateConferenceAsync(cacheModel);
            var updatedCacheModel = _memoryCache.Get(conference.Id).As<Conference>();
            updatedCacheModel.HearingVenueName.Should().Be(newVenueName);

        }

        [Test]
        public async Task GetOrAddConferenceAsync_should_return_conference_when_cache_contains_key()
        {
            var conference = new Conference { Id = Guid.NewGuid() };

            _memoryCache.Set(conference.Id, conference);
            var result = await _conferenceCache.GetOrAddConferenceAsync(conference.Id, DummyInput);

            result.Should().NotBeNull();
            result.Id.Should().Be(conference.Id);
        }
        
        [Test]
        public async Task GetOrAddConferenceAsync_should_return_conference_when_cache_does_not_contains_key()
        {
            var conferenceDetails = CreateConferenceResponse();
            var hearingDetails = CreateHearingResponse();
            conferenceDetails.Id = Guid.NewGuid();

            var result = await _conferenceCache.GetOrAddConferenceAsync(conferenceDetails.Id, () =>
            {
                _memoryCache.Set(conferenceDetails.Id, new Conference{ Id = conferenceDetails.Id });
                var responseObj = (conferenceDetails, hearingDetails);
                return Task.FromResult(responseObj);
            });

            result.Should().NotBeNull();
            result.Id.Should().Be(conferenceDetails.Id);
        }
    }
}
