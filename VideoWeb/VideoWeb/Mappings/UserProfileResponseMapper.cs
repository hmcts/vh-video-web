using System;
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
                "VhOfficer" => UserRole.VideoHearingsOfficer,
                "Representative" => UserRole.Representative,
                "Individual" => UserRole.Individual,
                "Judge" => UserRole.Judge,
                "CaseAdmin" => UserRole.CaseAdmin,
                _ => throw new NotSupportedException($"Role {userRole} is not supported for this application")
            };

            return response;
        }
    }
}
