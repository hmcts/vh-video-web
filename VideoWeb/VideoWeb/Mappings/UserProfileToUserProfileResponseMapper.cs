using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;

namespace VideoWeb.Mappings;

public static class UserProfileToUserProfileResponseMapper
{
    public static UserProfileResponse Map(UserProfile profile)
    {
        var response = new UserProfileResponse
        {
            FirstName = profile.FirstName,
            LastName = profile.LastName,
            DisplayName = profile.DisplayName,
            Username = profile.UserName,
            Roles = profile.Roles
        };
        
        return response;
    }
}
