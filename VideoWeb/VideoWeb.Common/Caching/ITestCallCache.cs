using System.Threading;
using System.Threading.Tasks;

namespace VideoWeb.Common.Caching;

public interface ITestCallCache
{
    Task AddTestCompletedForTodayAsync(string username, CancellationToken cancellationToken = default);
    Task<bool> HasUserCompletedATestToday(string username, CancellationToken cancellationToken = default);
}
