using System;
using System.Threading.Tasks;
using UserApi.Contract.Responses;

namespace VideoWeb.Common.Caching
{
    public interface IUserCache
    {
        Task<UserProfile> GetOrAddAsync(string key, Func<string, Task<UserProfile>> valueFactory);
    }
}
