using System.Threading.Tasks;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Caching
{
    public interface IUserProfileCache
    {
        Task<UserProfile> GetAsync(string key);
        Task<UserProfile> SetAsync(string key, UserProfile userProfile);
        Task<UserProfile> GetOrAddAsync(string key, UserProfile userProfile);
        Task ClearFromCache(string key);
    }
}
