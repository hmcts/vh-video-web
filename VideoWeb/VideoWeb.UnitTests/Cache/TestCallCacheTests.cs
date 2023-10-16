using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Internal;
using NUnit.Framework;
using VideoWeb.Common.Caching;

namespace VideoWeb.UnitTests.Cache;

public class TestCallCacheTests
{
    private IMemoryCache _memoryCache;
    private TestCallCache _sut;

    [SetUp]
    public void SetUp()
    {
        _memoryCache = new MemoryCache(new MemoryCacheOptions());
        _sut = new TestCallCache(_memoryCache);
    }
    
    [Test]
    public async Task Should_add_user_to_cache_when_user_has_completed_a_test_today()
    {
        var username = "username";

        var preAddResult = await _sut.HasUserCompletedATestToday(username);
        preAddResult.Should().BeFalse();
        
        await _sut.AddTestCompletedForTodayAsync(username);
        
        var postAddResult = await _sut.HasUserCompletedATestToday(username);
        postAddResult.Should().BeTrue();
    }
}
