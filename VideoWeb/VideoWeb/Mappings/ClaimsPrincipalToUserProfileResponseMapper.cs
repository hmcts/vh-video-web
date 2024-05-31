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
            Username = user.Identity.Name.ToLower().Trim(),
            Name =  user.Claims.Last(c => c.Type == ClaimTypes.Name).Value
        };
        return response;
    }

    private static List<Role> DetermineRolesFromClaims(ClaimsPrincipal user)
    {
        var roles = new List<Role>();
        
        if (user.IsInRole(AppRoles.VhOfficerRole))
            roles.Add(Role.VideoHearingsOfficer);
        if (user.IsInRole(AppRoles.Administrator))
            roles.Add(Role.Administrator);
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
        if(!roles.Any())
            throw new NotSupportedException($"No supported role for this application");
        return roles;
    }
}

