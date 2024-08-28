using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;

namespace VideoWeb.Common.Caching;

public sealed class TestCallCache : ITestCallCache
{
    private readonly IMemoryCache _memoryCache;
    private static string CacheKeySuffix => "_TestCallCache";

    public TestCallCache(IMemoryCache memoryCache)
    {
        _memoryCache = memoryCache;
    }

    public async Task AddTestCompletedForTodayAsync(string username, CancellationToken cancellationToken = default)
    {
        await Task.Run(() => _memoryCache.Set($"{username}{CacheKeySuffix}", true), cancellationToken);
    }

    public Task<bool> HasUserCompletedATestToday(string username, CancellationToken cancellationToken = default)
    {
        return Task.Run(() => _memoryCache.Get<bool>($"{username}{CacheKeySuffix}"), cancellationToken);
    }
}
