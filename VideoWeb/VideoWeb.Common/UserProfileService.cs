using System.Threading.Tasks;
using System.Security.Claims;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using System.Collections.Generic;
using System.Linq;
using System;

namespace VideoWeb.Common
{
    public interface IUserProfileService
    {
        string GetObfuscatedUsernameAsync(string participantUserName);
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

        public string GetObfuscatedUsernameAsync(string participantUserName)
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

            if (user.IsInRole(AppRoles.VhOfficerRole))
                roles.Add(Role.VideoHearingsOfficer);
            if (user.IsInRole(AppRoles.JudgeRole))
                roles.Add(Role.Judge);
            if (user.IsInRole(AppRoles.JudicialOfficeHolderRole))
                roles.Add(Role.JudicialOfficeHolder);
            if (user.IsInRole(AppRoles.RepresentativeRole))
                roles.Add(Role.Representative);
            if (user.IsInRole(AppRoles.CitizenRole))
                roles.Add(Role.Individual);
            if (user.IsInRole(AppRoles.QuickLinkObserver))
                roles.Add(Role.QuickLinkObserver);
            if (user.IsInRole(AppRoles.QuickLinkParticipant))
                roles.Add(Role.QuickLinkParticipant);
            if (user.IsInRole(AppRoles.CaseAdminRole))
                roles.Add(Role.CaseAdmin);
            if (user.IsInRole(AppRoles.StaffMember))
                roles.Add(Role.StaffMember);
            if (!roles.Any())
                throw new NotSupportedException($"No supported role for this application");
            return roles;
        }
    }
}
