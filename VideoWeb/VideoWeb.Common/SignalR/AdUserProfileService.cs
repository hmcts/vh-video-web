using System.Threading.Tasks;
using UserApi.Client;
using UserApi.Contract.Responses;
using VideoApi.Client;
using VideoApi.Contract.Consts;
using VideoApi.Contract.Enums;

namespace VideoWeb.Common.SignalR
{
    public interface IUserProfileService
    {
        Task<string> GetObfuscatedUsernameAsync(string participantUserName);
        Task<UserProfile> GetUserAsync(string username);

    }

    public class AdUserProfileService : IUserProfileService
    {
        private readonly IUserApiClient _userApiClient;
        private readonly IVideoApiClient _videoApiClient;

        public AdUserProfileService(IUserApiClient userApiClient, IVideoApiClient videoApiClient)
        {
            _userApiClient = userApiClient;
            _videoApiClient = videoApiClient;
        }

        public async Task<string> GetObfuscatedUsernameAsync(string participantUserName)
        {
            try
            {
                var userName = participantUserName;
                if (!IsQuickLinkParticipant(userName))
                {
                    var profile = await _userApiClient.GetUserByAdUserNameAsync(participantUserName);
                    userName = $"{profile.FirstName} {profile.LastName}";
                }

                var obfuscatedUsername = System.Text.RegularExpressions.Regex.Replace(userName, @"(?!\b)\w", "*");
                return obfuscatedUsername;
            }
            catch (UserApiException)
            {
                return string.Empty;
            }
        }

        public async Task<UserProfile> GetUserAsync(string username)
        {
            if (IsQuickLinkParticipant(username))
            {
                var quickNonparticipant = await _videoApiClient.GetQuickLinkParticipantByUserNameAsync(username);
                return new UserProfile()
                {
                    UserName = username,
                    DisplayName = quickNonparticipant.DisplayName,
                    UserRole = quickNonparticipant.UserRole.ToString()
                };
            }
            
            var usernameClean = username.ToLower().Trim();
            var profile = await _userApiClient.GetUserByAdUserNameAsync(usernameClean);
            return profile;
        }

        private bool IsQuickLinkParticipant(string userName)
        {
            return userName.EndsWith(QuickLinkParticipantConst.Domain);
        }
    }
}
