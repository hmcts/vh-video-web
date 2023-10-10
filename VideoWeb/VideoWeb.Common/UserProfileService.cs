using System.Threading.Tasks;
using System.Security.Claims;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System;

namespace VideoWeb.Common
{
    public interface IUserProfileService
    {
        string GetObfuscatedUsername(string participantUserName);
        Task<UserProfile> GetUserAsync(string username);
        Task<UserProfile> CacheUserProfileAsync(ClaimsPrincipal user);
    }

    public class UserProfileService : IUserProfileService
    {
        private readonly IUserCache _userCache;

        public UserProfileService(IUserCache userCache)
        {
            _userCache = userCache;
        }

        public string GetObfuscatedUsername(string participantUserName)
        {
            var obfuscatedUsername = System.Text.RegularExpressions.Regex.Replace(participantUserName, @"(?!\b)\w", "*");
            return obfuscatedUsername;
        }

        public async Task<UserProfile> GetUserAsync(string username)
        {
            var usernameClean = username.ToLower().Trim();
            return await _userCache.GetOrAddAsync(usernameClean, null);
        }

        public async Task<UserProfile> CacheUserProfileAsync(ClaimsPrincipal user)
        {
            var usernameClean = user.Identity.Name.ToLower().Trim();
            var userProfile = await _userCache.GetOrAddAsync(usernameClean, new UserProfile
            {
                FirstName = user.FindFirst(ClaimTypes.GivenName).Value,
                LastName = user.FindFirst(ClaimTypes.Surname).Value,
                Email = user.FindFirst(ClaimTypes.Email).Value,
                UserName = user.Identity.Name,
                Roles = DetermineRolesFromClaims(user),
                IsAdmin = IsAdmin(user)
            });

            return userProfile;
        }

        private static bool IsAdmin(ClaimsPrincipal user)
        {
            return user.IsInRole(AppRoles.VhOfficerRole);
        }

        private static List<Role> DetermineRolesFromClaims(ClaimsPrincipal user)
        {
            var roles = new List<Role>();
            var userRoles = Enum.GetValues(typeof(Role)).Cast<Role>().Select(x => x.ToString());

            var fields = typeof(AppRoles).GetFields(BindingFlags.Public | BindingFlags.Static);
            foreach(var field in fields)
            {
                var appRole = (string)field.GetValue(null);
                var userRole = Enum.GetValues(typeof(Role)).Cast<Role>().SingleOrDefault(x => x.ToString().Contains(appRole));
                if (user.IsInRole(appRole) && userRoles.Contains(appRole))
                {
                    roles.Add(userRole);
                }
                if (user.IsInRole(appRole) && appRole == "Citizen")
                {
                    roles.Add(Role.Individual);
                }
                if (user.IsInRole(appRole) && appRole == "VHO")
                {
                    roles.Add(Role.VideoHearingsOfficer);
                }
                if (user.IsInRole(appRole) && appRole == "ProfessionalUser")
                {
                    roles.Add(Role.Representative);
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
