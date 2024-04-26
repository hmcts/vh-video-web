using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Requests.Enums;
using BookingsApi.Contract.V2.Responses;
using Microsoft.AspNetCore.Mvc;
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
            claims = new List<Claim>();
            try
            {
                var hearings = await _bookingsApiClient!.GetConfirmedHearingsByUsernameForToday2Async(username);
                   
                var participant = hearings.SelectMany(x => x.Participants)
                    .FirstOrDefault(x => x.Username.Equals(username, StringComparison.InvariantCultureIgnoreCase));
                
                var judiaryParticipant = hearings.SelectMany(x => x.JudiciaryParticipants)
                    .FirstOrDefault(x => x.Email.Equals(username, StringComparison.InvariantCultureIgnoreCase));

                if (judiaryParticipant != null)
                {
                    var appRole = judiaryParticipant.HearingRoleCode == JudiciaryParticipantHearingRoleCode.Judge
                        ? AppRoles.JudgeRole 
                        : AppRoles.JudicialOfficeHolderRole;
                    claims.Add(new Claim(ClaimTypes.Role, appRole));
                    claims.Add(new Claim(ClaimTypes.GivenName, judiaryParticipant.FirstName));
                    claims.Add(new Claim(ClaimTypes.Surname, judiaryParticipant.LastName));
                    await _userClaimscache.SetAsync(username, claims);
                    return claims;
                }
                
                if (participant != null)
                {
                    var appRole = GetRoleFromParticipant(participant);
                    if (appRole != null) claims.Add(new Claim(ClaimTypes.Role, appRole));
                    claims.Add(new Claim(ClaimTypes.GivenName, participant.FirstName));
                    claims.Add(new Claim(ClaimTypes.Surname, participant.LastName));
                    await _userClaimscache.SetAsync(username, claims);
                    return claims;
                }
                
                var getJusticeUserTask = _bookingsApiClient!.GetJusticeUserByUsernameAsync(username);
                var user = await getJusticeUserTask;
                claims = MapUserRoleToAppRole(user.UserRoles);
                claims.Add(new Claim(ClaimTypes.GivenName, user.FirstName));
                claims.Add(new Claim(ClaimTypes.Surname, user.Lastname));
                await _userClaimscache.SetAsync(username, claims);
                return claims;
                
            }
            catch (BookingsApiException ex)
            {
                if (ex.StatusCode == (int)System.Net.HttpStatusCode.NotFound)
                {
                    var typedException = ex as BookingsApiException<ProblemDetails>;
                    _logger.LogWarning(typedException, "User {Username} not found as a JusticeUser in BookingsApi", username);
                }
            }

            return claims;
        }

        private static string GetRoleFromParticipant(ParticipantResponseV2 participant)
        {
            var userRole = participant.UserRoleName;
            var appRole = userRole.ToLower() switch
            {
                "case admin" => AppRoles.CaseAdminRole,
                "Video hearings officer" => AppRoles.VhOfficerRole,
                "hearing facilitation support (ctrt clerk)" => AppRoles.VhOfficerRole,
                "video hearings team lead" => AppRoles.VhOfficerRole,
                "judge" => AppRoles.JudgeRole,
                "individual" => AppRoles.CitizenRole,
                "representative" => AppRoles.RepresentativeRole,
                "staff member" => AppRoles.StaffMember,
                "judicial office holder" => AppRoles.JudicialOfficeHolderRole,
                _ => null
            };
            return appRole;
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
