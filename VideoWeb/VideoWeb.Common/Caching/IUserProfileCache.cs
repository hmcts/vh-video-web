using System.Threading;
using System.Threading.Tasks;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Caching
{
    public interface IUserProfileCache
    {
        Task<UserProfile> GetAsync(string key, CancellationToken cancellationToken = default);
        Task<UserProfile> SetAsync(string key, UserProfile userProfile, CancellationToken cancellationToken = default);
        Task<UserProfile> GetOrAddAsync(string key, UserProfile userProfile, CancellationToken cancellationToken = default);
        Task ClearFromCache(string key, CancellationToken cancellationToken = default);
    }
}
