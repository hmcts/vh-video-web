using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Configuration;

namespace VideoWeb.UnitTests.Cache;

public class DistributedConferenceCacheTests : CacheTestBase
{
    private Mock<IDistributedCache> _distributedCacheMock;
    private Mock<ILogger<DistributedConferenceCache>> _loggerMock;
    private CacheSettings _cacheSettings;
    
    [SetUp]
    public void Setup()
    {
        _distributedCacheMock = new Mock<IDistributedCache>();
        _loggerMock = new Mock<ILogger<DistributedConferenceCache>>();
        _cacheSettings = new CacheSettings { CacheDuration = 1 };
    }
    
    [Test]
    public async Task GetOrAddConferenceAsync_should_return_conference_when_cache_contains_key()
    {
        var conferenceResponse = CreateConferenceResponse();
        var hearingDetails = CreateHearingResponse(conferenceResponse);
        var conference = ConferenceCacheMapper.MapConferenceToCacheModel(conferenceResponse, hearingDetails);
        var serialisedConference = JsonSerializer.Serialize(conference, CachingHelper.JsonSerializerOptions);
        var rawData = Encoding.UTF8.GetBytes(serialisedConference);
        _distributedCacheMock
            .Setup(x => x.GetAsync(conference.Id.ToString(), CancellationToken.None))
            .ReturnsAsync(rawData);
        
        var cache = new DistributedConferenceCache(_distributedCacheMock.Object, _loggerMock.Object, _cacheSettings);
        
        var result = await cache.GetOrAddConferenceAsync(conference.Id, DummyInput);
        result.Should().BeEquivalentTo(conference);
    }
    
    [Test]
    public async Task GetOrAddConferenceAsync_should_return_conference_when_cache_does_not_contains_key()
    {
        var conferenceResponse = CreateConferenceResponse();
        var hearingDetails = CreateHearingResponse(conferenceResponse);
        var conference = ConferenceCacheMapper.MapConferenceToCacheModel(conferenceResponse, hearingDetails);
        var serialisedConference = JsonSerializer.Serialize(conference, CachingHelper.JsonSerializerOptions);
        var rawData = Encoding.UTF8.GetBytes(serialisedConference);
        _distributedCacheMock
            .SetupSequence(x => x.GetAsync(conference.Id.ToString(), CancellationToken.None))
            .ReturnsAsync((byte[]) null)
            .ReturnsAsync(rawData);
        
        _distributedCacheMock
            .Setup(x => x.SetAsync(conference.Id.ToString(), rawData, It.IsAny<DistributedCacheEntryOptions>(), CancellationToken.None));
        
        var cache = new DistributedConferenceCache(_distributedCacheMock.Object, _loggerMock.Object, _cacheSettings);
        
        var result = await cache.GetOrAddConferenceAsync(conference.Id, async () => await Task.FromResult((conferenceResponse, hearingDetails)));
        result.Should().BeEquivalentTo(conference);
    }
    
    [Test]
    public async Task RemoveConferenceAsync_should_remove_conference_from_cache()
    {
        // Arrange
        var conferenceResponse = CreateConferenceResponse();
        var hearingDetails = CreateHearingResponse(conferenceResponse);
        var conference = ConferenceCacheMapper.MapConferenceToCacheModel(conferenceResponse, hearingDetails);
        var serialisedConference = JsonSerializer.Serialize(conference, CachingHelper.JsonSerializerOptions);
        var rawData = Encoding.UTF8.GetBytes(serialisedConference);
        _distributedCacheMock
            .Setup(x => x.GetAsync(conference.Id.ToString(), CancellationToken.None))
            .ReturnsAsync(rawData);
        
        var cache = new DistributedConferenceCache(_distributedCacheMock.Object, _loggerMock.Object, _cacheSettings);
        
        // Act
        await cache.RemoveConferenceAsync(conference);
        
        // Assert
        _distributedCacheMock.Verify(x => x.RemoveAsync(conference.Id.ToString(), default), Times.Once);
    }
}
