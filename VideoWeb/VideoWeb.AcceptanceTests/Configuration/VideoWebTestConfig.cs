using AcceptanceTests.Common.Configuration;
using AcceptanceTests.Common.Driver.Support;

namespace VideoWeb.AcceptanceTests.Configuration
{
    public class VideoWebTestConfig : ITestSettingsConfig
    {
        public string TestUsernameStem { get; set; }
        public string TestUserPassword { get; set; }
        public TargetBrowser TargetBrowser { get; set; }
        public TargetDevice TargetDevice { get; set; }
    }
}
