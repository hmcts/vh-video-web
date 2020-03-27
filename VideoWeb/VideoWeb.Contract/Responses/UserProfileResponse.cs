using VideoWeb.Common.Models;

namespace VideoWeb.Contract.Responses
{
    public class UserProfileResponse
    {
        public Role Role { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string DisplayName { get; set; }
    }
}
