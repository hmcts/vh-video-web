using System.Collections.Generic;
using VideoWeb.AcceptanceTests.Helpers;

namespace VideoWeb.AcceptanceTests.Configuration
{
    public class TestSettings
    {
        public string TestClientId { get; set; }
        public string TestClientSecret { get; set; }
        public List<UserAccount> UserAccounts { get; set; }
    }
}
