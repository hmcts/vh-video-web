using System.Threading.Tasks;

namespace VideoWeb.Common.Caching;

public interface ITestCallCache
{
    Task AddTestCompletedForTodayAsync(string username);
    Task<bool> HasUserCompletedATestToday(string username);
}
