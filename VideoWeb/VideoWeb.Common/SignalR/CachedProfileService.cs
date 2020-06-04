using System.Threading.Tasks;
using VideoWeb.Common.Caching;
using VideoWeb.Services.User;

namespace VideoWeb.Common.SignalR
{
    public class CachedProfileService : IUserProfileService
    {
        private readonly AdUserProfileService _userProfileService;
        private readonly IUserCache _userCache;

        public CachedProfileService(AdUserProfileService userProfileService, IUserCache userCache)
        {
            _userProfileService = userProfileService;
            _userCache = userCache;
        }
        
        public Task<string> GetObfuscatedUsernameAsync(string username)
        {
            return _userProfileService.GetObfuscatedUsernameAsync(username);
        }

        public Task<UserProfile> GetUserAsync(string username)
        {
            var usernameClean = username.ToLower().Trim();
            var userProfile = _userCache.GetOrAddAsync
            (
                usernameClean, async key => await _userProfileService.GetUserAsync(usernameClean)
            );
            return userProfile;
        }
    }
}
