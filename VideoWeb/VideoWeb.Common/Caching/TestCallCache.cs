using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;

namespace VideoWeb.Common.Caching;

public class TestCallCache : ITestCallCache
{
    private readonly IMemoryCache _memoryCache;
    private string _cacheKeySuffix => "_TestCallCache";

    public TestCallCache(IMemoryCache memoryCache)
    {
        _memoryCache = memoryCache;
    }

    public Task AddTestCompletedForTodayAsync(string username)
    {
        _memoryCache.Set($"{username}{_cacheKeySuffix}", true);
        return Task.CompletedTask;
    }

    public Task<bool> HasUserCompletedATestToday(string username)
    {
        return Task.FromResult(_memoryCache.Get<bool>(($"{username}{_cacheKeySuffix}")));
    }
}
