using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Services.User;

namespace VideoWeb.Common.Security
{
    public interface ICachedUserClaimBuilder
    {
        Task<IEnumerable<Claim>> BuildAsync(string username, string cacheKey);
    }

    public class CachedUserClaimBuilder : ICachedUserClaimBuilder
    {
        private readonly IUserCache _userCache;
        private readonly IUserApiClient _userApiClient;

        public CachedUserClaimBuilder(IUserCache userCache, IUserApiClient userApiClient)
        {
            _userCache = userCache;
            _userApiClient = userApiClient;
        }

        //We cache the task of UserRole because we only want the async method to get user role once 
        public async Task<IEnumerable<Claim>> BuildAsync(string username, string cacheKey)
        {
            var userProfile = await _userCache.GetOrAddAsync
            (
                cacheKey, async key => await GetUserAsync(username)
            );

            var role = userProfile.User_role switch
            {
                "VhOfficer" => Role.VideoHearingsOfficer,
                "Representative" => Role.Representative,
                "Individual" => Role.Individual,
                "Judge" => Role.Judge,
                "CaseAdmin" => Role.CaseAdmin,
                _ => throw new NotSupportedException($"Role {userProfile.User_role} is not supported for this application")
            };
            
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.GivenName, userProfile.First_name),
                new Claim(ClaimTypes.Surname, userProfile.Last_name),
                new Claim(ClaimTypes.Name, userProfile.Display_name),
                new Claim(ClaimTypes.Role, role.ToString()),
            };

            return claims;
        }
        
        private async Task<UserProfile> GetUserAsync(string username)
        {
            var usernameClean = username.ToLower().Trim();
            var profile = await _userApiClient.GetUserByAdUserNameAsync(usernameClean);

            return profile;
        }
    }
}
