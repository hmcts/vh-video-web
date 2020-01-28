using System.Collections.Generic;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Driver;
using VideoWeb.AcceptanceTests.Configuration;
using Test = VideoWeb.AcceptanceTests.Data.Test;

namespace VideoWeb.AcceptanceTests.Helpers
{
    public class TestContext
    {
        public Apis Apis { get; set; }
        public UserAccount CurrentUser { get; set; }
        public DriverSetup Driver { get; set; }
        public Test Test { get; set; }
        public VideoWebTokens Tokens { get; set; }
        public List<UserAccount> UserAccounts { get; set; }
        public VideoWebConfig VideoWebConfig { get; set; }
    }
}