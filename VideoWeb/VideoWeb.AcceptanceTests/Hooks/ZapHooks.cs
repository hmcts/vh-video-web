using AcceptanceTests.Common.Api;
using Microsoft.Extensions.Configuration;
using AcceptanceTests.Common.Configuration;
using VideoWeb.AcceptanceTests.Configuration;
using TechTalk.SpecFlow;

namespace VideoWeb.AcceptanceTests.Hooks
{
    [Binding]
    public static class ZapHooks
    {
        private static VideoWebVhServicesConfig VhServices => ConfigurationManager.BuildConfig("CA353381-2F0D-47D7-A97B-79A30AFF8B86").GetSection("VhServices").Get<VideoWebVhServicesConfig>();

        [BeforeTestRun]
        public static void ZapStart()
        {
            Zap.Start();
        }

        [AfterTestRun]
        public static void ZapReport()
        {
            if (VhServices.VideoWebApiUrl != null)
            {
                Zap.ReportAndShutDown("VideoWeb-Acceptance", VhServices.VideoWebApiUrl);
            }
        }
    }
}
