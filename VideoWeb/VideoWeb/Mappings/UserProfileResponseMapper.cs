using System;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.User;

namespace VideoWeb.Mappings
{
    public class UserProfileResponseMapper
    {
        public UserProfileResponse MapToResponseModel(UserProfile profile)
        {
            var response = new UserProfileResponse();

            var userRole = profile.User_role;
            switch (userRole)
            {
                case "VhOfficer": response.Role = UserRole.VideoHearingsOfficer; break;
                case "Representative": response.Role = UserRole.Representative; break;
                case "Individual": response.Role = UserRole.Individual; break;
                case "Judge": response.Role = UserRole.Judge; break;
                case "CaseAdmin": response.Role = UserRole.CaseAdmin; break;
                default: throw new NotSupportedException($"Role {userRole} is not supported for this application");
            }
            return response;
        }
    }
}