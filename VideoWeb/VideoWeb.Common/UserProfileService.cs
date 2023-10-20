using System.Threading.Tasks;
using System.Security.Claims;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System;
using System.Text.RegularExpressions;

namespace VideoWeb.Common
{
    public interface IUserProfileService
    {
        string GetObfuscatedUsername(string participantUserName);
        Task<UserProfile> GetUserAsync(string username);
        Task<UserProfile> CacheUserProfileAsync(ClaimsPrincipal user);
        Task ClearUserCache(string username);
    }

    public class UserProfileService : IUserProfileService
    {
        private readonly IUserProfileCache _userProfileCache;

        public UserProfileService(IUserProfileCache userCache)
        {
            _userProfileCache = userCache;
        }

        public string GetObfuscatedUsername(string participantUserName)
        {
            var obfuscatedUsername = Regex.Replace(participantUserName, @"(?!\b)\w", "*", RegexOptions.None, TimeSpan.FromMilliseconds(100));
            return obfuscatedUsername;
        }

        public async Task<UserProfile> GetUserAsync(string username)
        {
            var usernameClean = username.ToLower().Trim();
            return await _userProfileCache.GetAsync(usernameClean);
        }

        public async Task<UserProfile> CacheUserProfileAsync(ClaimsPrincipal user)
        {
            var usernameClean = user.Identity.Name.ToLower().Trim();
            var userProfile = await _userProfileCache.GetOrAddAsync(usernameClean, new UserProfile
            {
                FirstName = user.FindFirst(ClaimTypes.GivenName).Value,
                LastName = user.FindFirst(ClaimTypes.Surname).Value,
                Email = usernameClean,
                UserName = usernameClean,
                Roles = DetermineRolesFromClaims(user),
                IsAdmin = IsAdmin(user)
            });

            return userProfile;
        }

        public async Task ClearUserCache(string username)
        {
            await _userProfileCache.ClearFromCache(username);
        }

        private static bool IsAdmin(ClaimsPrincipal user)
        {
            return user.IsInRole(AppRoles.VhOfficerRole);
        }

        private static List<Role> DetermineRolesFromClaims(ClaimsPrincipal user)
        {
            var roles = new List<Role>();
            var cliams = new List<Claim>();
            var userRoles = Enum.GetValues(typeof(Role)).Cast<Role>().Select(x => x.ToString());

            var fields = typeof(AppRoles).GetFields(BindingFlags.Public | BindingFlags.Static);
            foreach(var field in fields)
            {
                var appRole = (string)field.GetValue(null);
                var userRole = Enum.GetValues(typeof(Role)).Cast<Role>().SingleOrDefault(x => x.ToString().Contains(appRole));
                if (user.IsInRole(appRole) && userRoles.Contains(appRole))
                {
                    roles.Add(userRole);
                    cliams.Add(new Claim(ClaimTypes.Role, appRole));
                }
                if (user.IsInRole(appRole) && appRole == "Citizen")
                {
                    roles.Add(Role.Individual);
                    cliams.Add(new Claim(ClaimTypes.Role, appRole));
                }
                if (user.IsInRole(appRole) && appRole == "VHO")
                {
                    roles.Add(Role.VideoHearingsOfficer);
                    cliams.Add(new Claim(ClaimTypes.Role, appRole));
                }
                if (user.IsInRole(appRole) && appRole == "ProfessionalUser")
                {
                    roles.Add(Role.Representative);
                    cliams.Add(new Claim(ClaimTypes.Role, appRole));
                }
            }
            if (!roles.Any())
            {
                throw new NotSupportedException($"No supported role for this application");
            }

            return roles;
        }
    }
}
