using System.Collections.Generic;
using System.Security.Claims;

namespace VideoWeb.Common.Models
{
    public class UserProfile
    {
        public string UserName { get; set; }
        public string DisplayName { get; set; }
        public List<Role> Roles { get; set; } = new List<Role>();
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public bool IsAdmin { get; set; }
    }
}
