using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Requests.Enums;
using BookingsApi.Contract.V1.Responses;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;

namespace VideoWeb.Common
{
    public interface IAppRoleService
    {
        Task<List<Claim>> GetClaimsForUserAsync(string username);
        Task ClearUserCache(string username);
    }
    
    public class AppRoleService : IAppRoleService
    {
        private readonly IUserClaimsCache _userClaimscache;
        private readonly IBookingsApiClient _bookingsApiClient;
        private readonly ILogger<AppRoleService> _logger;

        private static readonly ConcurrentDictionary<string, SemaphoreSlim> Semaphores = new();
        
        public AppRoleService(IUserClaimsCache cache, IBookingsApiClient bookingsApiClient, ILogger<AppRoleService> logger)
        {
            _userClaimscache = cache;
            _bookingsApiClient = bookingsApiClient;
            _logger = logger;
        }

        public async Task<List<Claim>> GetClaimsForUserAsync(string username)
        {
            var claims = await _userClaimscache.GetAsync(username);
            if (claims != null)
            {
                return claims;
            }
            var semaphore = Semaphores.GetOrAdd(username, _ => new SemaphoreSlim(3, 3));
            await semaphore.WaitAsync();
            try{
                claims = await _userClaimscache.GetAsync(username);
                if (claims != null)
                {
                    return claims;
                }
                claims = await ConvertJusticeUserToClaimsAndCache(username);
                return claims;
            }
            finally
            {
                semaphore.Release();
            }
        }

        private async Task<List<Claim>> ConvertJusticeUserToClaimsAndCache(string username)
        {
            List<Claim> claims;
            JusticeUserResponse user = null;
            try
            {
                Console.WriteLine(username);
                user = await _bookingsApiClient!.GetJusticeUserByUsernameAsync(username);
            }
            catch (BookingsApiException ex)
            {
                if (ex.StatusCode == (int)System.Net.HttpStatusCode.NotFound)
                {
                    _logger.LogWarning(ex, "User {Username} not found as a JusticeUser in BookingsApi", username);
                }
            }

            if (user == null)
            {
                claims =
                [
                    new Claim(ClaimTypes.Role, "EmptyClaimToAvoidDefaultListValue")
                ];
            }
            else
            {
                claims = MapUserRoleToAppRole(user.UserRoles);
                claims.Add(new Claim(ClaimTypes.GivenName, user.FirstName));
                claims.Add(new Claim(ClaimTypes.Surname, user.Lastname));
                claims.Add(new Claim(ClaimTypes.Name, user.FullName));
            }

            await _userClaimscache.SetAsync(username, claims);
            return claims;
        }

        public async Task ClearUserCache(string username)
        {
            await _userClaimscache.ClearFromCache(username);
        }

        private static List<Claim> MapUserRoleToAppRole(List<JusticeUserRole> userRoles)
        {
            var claims = new List<Claim>();
            
            foreach (JusticeUserRole role in userRoles)
            {
                var appRole = role switch
                {
                    JusticeUserRole.CaseAdmin => AppRoles.CaseAdminRole,
                    JusticeUserRole.Vho => AppRoles.VhOfficerRole,
                    JusticeUserRole.Judge => AppRoles.JudgeRole,
                    JusticeUserRole.StaffMember => AppRoles.StaffMember,
                    JusticeUserRole.VhTeamLead => AppRoles.Administrator,
                    _ => null
                };
                if (appRole != null)
                {
                    claims.Add(new Claim(ClaimTypes.Role, appRole));
                }
            }
            
            if (userRoles.Exists(x => x == JusticeUserRole.VhTeamLead))
            {
                // Team leaders (Admins) are also VHOs so add the VHO role to get the same journey
                claims.Add(new Claim(ClaimTypes.Role, AppRoles.VhOfficerRole));
            }
            return claims;
        }
    }
}
