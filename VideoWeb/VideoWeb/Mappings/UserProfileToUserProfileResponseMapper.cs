using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
namespace VideoWeb.Mappings
{
    public class UserProfileToUserProfileResponseMapper : IMapTo<UserProfile, UserProfileResponse>
    {
        public UserProfileResponse Map(UserProfile profile)
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
}
