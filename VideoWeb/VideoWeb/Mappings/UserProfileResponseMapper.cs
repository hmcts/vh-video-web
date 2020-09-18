using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.User;

namespace VideoWeb.Mappings
{
    public static class UserProfileResponseMapper
    {
       
        
        const string Vhofficer = "VhOfficer";
        const string Representative = "Representative";
        const string Individual = "Individual";
        const string Judge = "Judge";
        const string CaseAdmin = "CaseAdmin";

        public static UserProfileResponse MapToResponseModel(UserProfile profile)
        {
            var response = new UserProfileResponse
            {
                FirstName = profile.First_name,
                LastName = profile.Last_name,
                DisplayName = profile.Display_name,
                Username = profile.User_name
            };

            var userRole = profile.User_role;

            response.Role = userRole switch
            {
                Vhofficer => Role.VideoHearingsOfficer,
                Representative => Role.Representative,
                Individual => Role.Individual,
                Judge => Role.Judge,
                CaseAdmin => Role.CaseAdmin,
                _ => throw new NotSupportedException($"Role {userRole} is not supported for this application")
            };

            return response;
        }

        public static UserProfileResponse MapUserToResponseModel(ClaimsPrincipal user)
        {
            var response = new UserProfileResponse
            {
                FirstName = user.Claims.First(c => c.Type == ClaimTypes.GivenName).Value,
                LastName = user.Claims.First(c => c.Type == ClaimTypes.Surname).Value,
                DisplayName = user.Claims.First(c => c.Type == "name").Value,
                Username = user.Identity?.Name?.ToLower().Trim(),
            };
            var roleClaims = user.Claims.Where(c => c.Type == ClaimTypes.Role).ToList();
            response.Role = DetermineRoleFromClaims(roleClaims);
            return response;
        }

        private static Role DetermineRoleFromClaims(List<Claim> roleClaims)
        {
            if (roleClaims.Exists(x => x.Value == AppRoles.VhOfficerRole))
            {
                return Role.VideoHearingsOfficer;
            }

            if (roleClaims.Exists(x => x.Value == AppRoles.JudgeRole))
            {
                return Role.Judge;
            }
            
            if (roleClaims.Exists(x => x.Value == AppRoles.RepresentativeRole))
            {
                return Role.Representative;
            }
            
            if (roleClaims.Exists(x => x.Value == AppRoles.CitizenRole))
            {
                return Role.Individual;
            }
            
            if (roleClaims.Exists(x => x.Value == AppRoles.CaseAdminRole))
            {
                return Role.CaseAdmin;
            }

            throw new NotSupportedException($"Role is not supported for this application");
        }
    }
}
