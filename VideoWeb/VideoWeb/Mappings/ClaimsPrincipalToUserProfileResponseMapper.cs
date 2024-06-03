using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings;
public class ClaimsPrincipalToUserProfileResponseMapper : IMapTo<ClaimsPrincipal, UserProfileResponse>
{
    public UserProfileResponse Map(ClaimsPrincipal user)
    {   
        var response = new UserProfileResponse
        {
            Roles = DetermineRolesFromClaims(user),
            FirstName = user.Claims.FirstOrDefault(c => c.Type == ClaimTypes.GivenName)?.Value,
            LastName = user.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Surname)?.Value,
            DisplayName = user.Claims.Last(c => c.Type == ClaimTypes.Name).Value,
            Username = user.Identity?.Name?.ToLower().Trim(),
            Name =  user.Claims.Last(c => c.Type == ClaimTypes.Name).Value
        };
        return response;
    }
    
    private static List<Role> DetermineRolesFromClaims(ClaimsPrincipal user)
    {
        var roleChecks = new Dictionary<Role, Func<ClaimsPrincipal, bool>>
        {
            { Role.VideoHearingsOfficer, u => u.IsInRole(AppRoles.VhOfficerRole) },
            { Role.Administrator, u => u.IsInRole(AppRoles.Administrator) },
            { Role.Judge, u => u.IsInRole(AppRoles.JudgeRole) },
            { Role.JudicialOfficeHolder, u => u.IsInRole(AppRoles.JudicialOfficeHolderRole) },
            { Role.Representative, u => u.IsInRole(AppRoles.RepresentativeRole) },
            { Role.Individual, u => u.IsInRole(AppRoles.CitizenRole) },
            { Role.QuickLinkObserver, u => u.IsInRole(AppRoles.QuickLinkObserver) },
            { Role.QuickLinkParticipant, u => u.IsInRole(AppRoles.QuickLinkParticipant) },
            { Role.CaseAdmin, u => u.IsInRole(AppRoles.CaseAdminRole) },
            { Role.StaffMember, u => u.IsInRole(AppRoles.StaffMember) }
        };
        
        var roles = roleChecks.Where(check => check.Value(user)).Select(check => check.Key).ToList();
        
        if (roles.Count == 0)
            throw new NotSupportedException($"No supported role for this application");
        
        return roles;
    }
}

