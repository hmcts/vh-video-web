using System.Threading.Tasks;
using UserApi.Client;
using UserApi.Contract.Responses;

namespace VideoWeb.Common.SignalR
{
    public interface IUserProfileService
    {
        Task<string> GetObfuscatedUsernameAsync(string username);
        Task<UserProfile> GetUserAsync(string username);
    }

    public class AdUserProfileService : IUserProfileService
    {
        private readonly IUserApiClient _userApiClient;

        public AdUserProfileService(IUserApiClient userApiClient)
        {
            _userApiClient = userApiClient;
        }

        public async Task<string> GetObfuscatedUsernameAsync(string username)
        {
            try
            {
                var profile = await _userApiClient.GetUserByAdUserNameAsync(username);
                var userName = profile.FirstName + " " + profile.LastName;
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
            var usernameClean = username.ToLower().Trim();
            var profile = await _userApiClient.GetUserByAdUserNameAsync(usernameClean);

            return profile;
        }
    }
}
