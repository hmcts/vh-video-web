using System.Threading.Tasks;
using System.Security.Claims;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System;
using System.Text.RegularExpressions;
using System.Threading;

namespace VideoWeb.Common
{
    public interface IUserProfileService
    {
        string GetObfuscatedUsername(string participantUserName);
        Task<UserProfile> GetUserAsync(string username, CancellationToken cancellationToken = default);
        Task<UserProfile> CacheUserProfileAsync(ClaimsPrincipal user, CancellationToken cancellationToken = default);
        Task ClearUserCache(string username, CancellationToken cancellationToken = default);
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

        public async Task<UserProfile> GetUserAsync(string username, CancellationToken cancellationToken = default)
        {
            var usernameClean = username.ToLower().Trim();
            return await _userProfileCache.GetAsync(usernameClean, cancellationToken);
        }

        public async Task<UserProfile> CacheUserProfileAsync(ClaimsPrincipal user, CancellationToken cancellationToken = default)
        {
            var usernameClean = user.Identity!.Name!.ToLower().Trim();
            var userProfile = await _userProfileCache.GetOrAddAsync(usernameClean, new UserProfile
            {
                FirstName = user.FindFirst(ClaimTypes.GivenName)?.Value,
                LastName = user.FindFirst(ClaimTypes.Surname)?.Value,
                Email = usernameClean,
                UserName = usernameClean,
                Roles = DetermineRolesFromClaims(user),
                IsAdmin = IsAdmin(user)
            }, cancellationToken);

            return userProfile;
        }

        public async Task ClearUserCache(string username, CancellationToken cancellationToken = default)
        {
            await _userProfileCache.ClearFromCache(username, cancellationToken);
        }

        private static bool IsAdmin(ClaimsPrincipal user)
        {
            return user.IsInRole(AppRoles.VhOfficerRole);
        }

        private List<Role> DetermineRolesFromClaims(ClaimsPrincipal user)
        {
            var roles = new List<Role>();
            var claims = new List<Claim>();
            var userRoles = Enum.GetValues(typeof(Role)).Cast<Role>().Select(x => x.ToString()).ToList();

            var fields = typeof(AppRoles).GetFields(BindingFlags.Public | BindingFlags.Static);
            foreach(var field in fields)
            {
                var appRole = (string)field.GetValue(null);
                var userRole = Enum.GetValues(typeof(Role)).Cast<Role>().SingleOrDefault(x => x.ToString().Contains(appRole));
                if (user.IsInRole(appRole) && userRoles.Contains(appRole))
                {
                    roles.Add(userRole);
                    claims.Add(new Claim(ClaimTypes.Role, appRole));
                }
                if (user.IsInRole(appRole) && appRole == "Citizen")
                {
                    roles.Add(Role.Individual);
                    claims.Add(new Claim(ClaimTypes.Role, appRole));
                }
                if (user.IsInRole(appRole) && appRole == "VHO")
                {
                    roles.Add(Role.VideoHearingsOfficer);
                    claims.Add(new Claim(ClaimTypes.Role, appRole));
                }
                if (user.IsInRole(appRole) && appRole == "ProfessionalUser")
                {
                    roles.Add(Role.Representative);
                    claims.Add(new Claim(ClaimTypes.Role, appRole));
                }
            }
            if (roles.Count == 0)
            {
                _userProfileCache.ClearFromCache(user.Identity!.Name);
                throw new NotSupportedException($"No supported role for this application");
            }

            return roles;
        }
    }
}
