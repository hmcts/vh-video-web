using AcceptanceTests.Common.Api;
using Microsoft.Extensions.Configuration;
using NUnit.Framework;
using AcceptanceTests.Common.Configuration;
using VideoWeb.AcceptanceTests.Configuration;

namespace VideoWeb.AcceptanceTests
{
    [SetUpFixture]
    public class TestSetupFixture
    {
        private VideoWebVhServicesConfig VhServices => ConfigurationManager.BuildConfig("CA353381-2F0D-47D7-A97B-79A30AFF8B86").GetSection("VhServices").Get<VideoWebVhServicesConfig>();

        [OneTimeSetUp]
        public void ZapStart()
        {
            Zap.Start();

            
        }

        [OneTimeTearDown]
        public void ZapReport()
        {
            Zap.ReportAndShutDown("VideoWeb-Acceptance", VhServices.VideoWebApiUrl);
        }
    }
}
