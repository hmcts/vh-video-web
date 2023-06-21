using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.Requests.Enums;
using BookingsApi.Contract.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;

namespace VideoWeb.Services
{
    public interface IAppRoleService
    {
        Task<List<Claim>> GetClaimsForUserAsync(string uniqueId, string username);
    }
    
    public class AppRoleService : IAppRoleService
    {
        private readonly IMemoryCache _cache;
        private readonly IBookingsApiClient _bookingsApiClient;
        private readonly ILogger<AppRoleService> _logger;

        public AppRoleService(IMemoryCache cache, IBookingsApiClient bookingsApiClient, ILogger<AppRoleService> logger)
        {
            _cache = cache;
            _bookingsApiClient = bookingsApiClient;
            _logger = logger;
        }
        
        public async Task<List<Claim>> GetClaimsForUserAsync(string uniqueId, string username)
        {
            var claims = _cache.Get<List<Claim>>(uniqueId);
            if (claims != null)
            {
                return claims;
            }
            
            JusticeUserResponse user = null;
            try
            {
                user = await _bookingsApiClient!.GetJusticeUserByUsernameAsync(username);
            }
            catch (BookingsApiException ex )
            {
                if (ex.StatusCode == (int) System.Net.HttpStatusCode.NotFound)
                {
                    var typedException = ex as BookingsApiException<ProblemDetails>;
                    _logger.LogWarning(typedException, "User {Username} not found as a JusticeUser in BookingsApi", username);
                }
            }

            if (user == null)
            {
                claims = new List<Claim>();
            }
            else
            {
                claims = MapUserRoleToAppRole(user.UserRoles);
                claims.Add(new Claim(ClaimTypes.GivenName, user.FirstName));
                claims.Add(new Claim(ClaimTypes.Surname, user.Lastname));
                claims.Add(new Claim(ClaimTypes.Name, user.FullName));
            }
            
            _cache.Set(uniqueId, claims, new MemoryCacheEntryOptions()
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(60),
                SlidingExpiration = TimeSpan.FromMinutes(30)
            });

            return claims;
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
                    JusticeUserRole.VhTeamLead => AppRoles.VhOfficerRole,
                    _ => null
                };
                if (appRole != null)
                {
                    claims.Add(new Claim(ClaimTypes.Role, appRole));
                }
            }
            
            return claims;
        }
    }
}
