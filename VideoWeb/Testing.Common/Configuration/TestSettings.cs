using System.Collections.Generic;
using VideoWeb.AcceptanceTests.Configuration;

namespace Testing.Common.Configuration
{
    public class TestSettings
    {
        public string TestClientId { get; set; }
        public string TestClientSecret { get; set; }
        public List<UserAccount> UserAccounts { get; set; }
        public string Password { get; set; }
    }
}
