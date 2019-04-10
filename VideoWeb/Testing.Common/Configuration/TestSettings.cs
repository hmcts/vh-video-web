using System.Collections.Generic;
using VideoWeb.AcceptanceTests.Configuration;

namespace Testing.Common.Configuration
{
    public class TestSettings
    {
        public string TestClientId { get; set; }
        public string TestClientSecret { get; set; }
        public string TestUserPassword { get; set; }
        public string TestUsernameStem { get; set; }
        public List<UserAccount> UserAccounts { get; set; }        
    }
}
