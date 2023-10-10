using System.Threading.Tasks;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Caching
{
    public interface IUserCache
    {
        Task<UserProfile> GetOrAddAsync(string key, UserProfile userProfile);
    }
}
