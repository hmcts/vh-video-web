using System;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using UserApi.Contract.Responses;

namespace VideoWeb.Mappings
{
    public class UserProfileToUserProfileResponseMapper : IMapTo<UserProfile, UserProfileResponse>
    {
        const string Vhofficer = "VhOfficer";
        const string Representative = "Representative";
        const string Individual = "Individual";
        const string Judge = "Judge";
        const string CaseAdmin = "CaseAdmin";
        const string JudicialOfficeHolder = "JudicialOfficeHolder";

        public UserProfileResponse Map(UserProfile profile)
        {
            var response = new UserProfileResponse
            {
                FirstName = profile.FirstName,
                LastName = profile.LastName,
                DisplayName = profile.DisplayName,
                Username = profile.UserName
            };

            var userRole = profile.UserRole;

            response.Role = userRole switch
            {
                Vhofficer => Role.VideoHearingsOfficer,
                Representative => Role.Representative,
                Individual => Role.Individual,
                Judge => Role.Judge,
                CaseAdmin => Role.CaseAdmin,
                JudicialOfficeHolder => Role.JudicialOfficeHolder,
                _ => throw new NotSupportedException($"Role {userRole} is not supported for this application")
            };

            return response;
        }
    }
}
