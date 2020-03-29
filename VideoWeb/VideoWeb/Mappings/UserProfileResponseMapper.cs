using System;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.User;

namespace VideoWeb.Mappings
{
    public static class UserProfileResponseMapper
    {
        public static UserProfileResponse MapToResponseModel(UserProfile profile)
        {
            var response = new UserProfileResponse
            {
                FirstName = profile.First_name, LastName = profile.Last_name, DisplayName = profile.Display_name
            };

            var userRole = profile.User_role;

            response.Role = userRole switch
            {
                "VhOfficer" => Role.VideoHearingsOfficer,
                "Representative" => Role.Representative,
                "Individual" => Role.Individual,
                "Judge" => Role.Judge,
                "CaseAdmin" => Role.CaseAdmin,
                _ => throw new NotSupportedException($"Role {userRole} is not supported for this application")
            };

            return response;
        }
    }
}
