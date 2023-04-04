using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using BookingsApi.Client;
using Microsoft.Extensions.Caching.Memory;
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

        public AppRoleService(IMemoryCache cache, IBookingsApiClient bookingsApiClient)
        {
            _cache = cache;
            _bookingsApiClient = bookingsApiClient;
        }
        
        public async Task<List<Claim>> GetClaimsForUserAsync(string uniqueId, string username)
        {
            var claims = _cache.Get<List<Claim>>(uniqueId);
            if (claims != null)
            {
                return claims;
            }
            
            var user = await _bookingsApiClient!.GetJusticeUserByUsernameAsync(username);
            if (user == null) return new List<Claim>();
            claims = MapUserRoleToAppRole(user.UserRoleId);
            _cache.Set(uniqueId, claims, new MemoryCacheEntryOptions()
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(60),
                SlidingExpiration = TimeSpan.FromMinutes(30)
            });

            return claims;
        }
        
        private static List<Claim> MapUserRoleToAppRole(int userUserRoleId)
        {
            var appRole = userUserRoleId switch
            {
                (int) JusticeUserRole.CaseAdmin => AppRoles.CaseAdminRole,
                (int) JusticeUserRole.Vho => AppRoles.VhOfficerRole,
                (int) JusticeUserRole.Judge => AppRoles.JudgeRole,
                (int) JusticeUserRole.StaffMember => AppRoles.StaffMember,
                (int) JusticeUserRole.VhTeamLead => AppRoles.VhOfficerRole,
                _ => null
            };

            var claims = new List<Claim>();
            if (appRole != null)
            {
                claims.Add(new Claim(ClaimTypes.Role, appRole));
            }
            
            return claims;
        }

        public enum JusticeUserRole
        {
            CaseAdmin = 1,
            Vho = 2,
            // Clerk = 3,
            Judge = 4,
            // Individual = 5,
            // Representative = 6,
            // JudicialOfficeHolder = 7,
            StaffMember = 8,
            VhTeamLead = 9
        }
    }
}
