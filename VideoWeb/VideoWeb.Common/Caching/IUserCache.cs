using System;
using System.Threading.Tasks;
using VideoWeb.Services.User;

namespace VideoWeb.Common.Caching
{
    public interface IUserCache
    {
        Task<UserProfile> GetOrAddAsync(string key, Func<string, Task<UserProfile>> valueFactory);
    }
}
