using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;

namespace VideoWeb.UnitTests.Cache;

public class DistributedTestCallCacheTests
{
    private Mock<IDistributedCache> _distributedCacheMock;
    private DistributedTestCallCache _sut;
    private Mock<ILogger<RedisCacheBase<string, bool>>> _loggerMock;

    [SetUp]
    public void Setup()
    {
        _distributedCacheMock = new Mock<IDistributedCache>();
        _loggerMock = new Mock<ILogger<RedisCacheBase<string, bool>>>();
        _sut = new DistributedTestCallCache(_distributedCacheMock.Object, _loggerMock.Object);
    }
    
    [Test]
    public async Task should_return_true_when_user_has_completed_a_test_today()
    {
        var username = "username";
        var key = $"{username}_SelfTestCompleted";
        var rawData = Encoding.UTF8.GetBytes("true");
        _distributedCacheMock.Setup(x => x.GetAsync(key, CancellationToken.None)).ReturnsAsync(rawData);

        var result = await _sut.HasUserCompletedATestToday(username);
        result.Should().BeTrue();
    }
    
    [Test]
    public async Task should_return_false_when_user_has_not_completed_a_test_today()
    {
        var username = "username";
        var key = $"{username}_SelfTestCompleted";
        _distributedCacheMock.Setup(x => x.GetAsync(key, CancellationToken.None)).ReturnsAsync(null as byte[]);

        var result = await _sut.HasUserCompletedATestToday(username);
        result.Should().BeFalse();
    }
    
    [Test]
    public async Task should_add_user_to_cache_when_user_has_completed_a_test_today()
    {
        var username = "username";
        var key = $"{username}_SelfTestCompleted";
        var rawData = Encoding.UTF8.GetBytes("true");
        _distributedCacheMock.Setup(x => x.GetAsync(key, CancellationToken.None)).ReturnsAsync(null as byte[]);

        await _sut.AddTestCompletedForTodayAsync(username);
        _distributedCacheMock.Verify(x => x.SetAsync(key, rawData, _sut.CacheEntryOptions, CancellationToken.None), Times.Once);
    }
}
