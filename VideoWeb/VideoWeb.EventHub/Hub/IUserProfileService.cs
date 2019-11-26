using System.Threading.Tasks;
using VideoWeb.Services.User;

namespace VideoWeb.EventHub.Hub
{
    public interface IUserProfileService
    {
        Task<bool> IsAdmin(string username);
        Task<string> GetUsername(string username);
    }

    public class AdUserProfileService : IUserProfileService
    {
        private readonly IUserApiClient _userApiClient;

        public AdUserProfileService(IUserApiClient userApiClient)
        {
            _userApiClient = userApiClient;
        }

        public async Task<bool> IsAdmin(string username)
        {
            try
            {
                var profile = await _userApiClient.GetUserByAdUserNameAsync(username);
                return profile.User_role == "VhOfficer";
            }
            catch (UserApiException)
            {
                return false;
            }
        }

        public async Task<string> GetUsername(string username)
        {
            try
            {
                var profile = await _userApiClient.GetUserByAdUserNameAsync(username);
                var userName = profile.First_name + " " + profile.Last_name;
                var obfuscatedUsername = System.Text.RegularExpressions.Regex.Replace(userName, @"(?!\b)\w", "*");
                return obfuscatedUsername;
            }
            catch (UserApiException)
            {
                return string.Empty;
            }
        }
    }
}