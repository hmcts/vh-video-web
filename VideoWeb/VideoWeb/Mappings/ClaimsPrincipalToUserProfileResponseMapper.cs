using System;
using System.Linq;
using System.Security.Claims;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;

namespace VideoWeb.Mappings
{
    public class ClaimsPrincipalToUserProfileResponseMapper : IMapTo<UserProfileResponse, ClaimsPrincipal>
    {
        public UserProfileResponse Map(ClaimsPrincipal user)
        {
            var response = new UserProfileResponse
            {
                FirstName = user.Claims.First(c => c.Type == ClaimTypes.GivenName).Value,
                LastName = user.Claims.First(c => c.Type == ClaimTypes.Surname).Value,
                DisplayName = user.Claims.First(c => c.Type == "name").Value,
                Username = user.Identity?.Name?.ToLower().Trim(),
                Role = DetermineRoleFromClaims(user)
            };
            return response;
        }

        private Role DetermineRoleFromClaims(ClaimsPrincipal user)
        {
            if (user.IsInRole(AppRoles.VhOfficerRole))
            {
                return Role.VideoHearingsOfficer;
            }

            if (user.IsInRole(AppRoles.JudgeRole))
            {
                return Role.Judge;
            }

            if (user.IsInRole(AppRoles.JudicialOfficeHolderRole))
            {
                return Role.JudicialOfficeHolder;
            }

            if (user.IsInRole(AppRoles.RepresentativeRole))
            {
                return Role.Representative;
            }

            if (user.IsInRole(AppRoles.CitizenRole))
            {
                return Role.Individual;
            }

            if (user.IsInRole(AppRoles.CaseAdminRole))
            {
                return Role.CaseAdmin;
            }

            throw new NotSupportedException($"Role is not supported for this application");
        }
    }
}
