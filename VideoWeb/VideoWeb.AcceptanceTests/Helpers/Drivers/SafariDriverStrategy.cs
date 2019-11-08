using OpenQA.Selenium;
using OpenQA.Selenium.Remote;
using OpenQA.Selenium.Safari;

namespace VideoWeb.AcceptanceTests.Helpers.Drivers
{
    internal class SafariDriverStrategy : Drivers
    {
        public override RemoteWebDriver InitialiseForSauceLabs()
        {
            var safariOptions = new SafariOptions() { PlatformName = MacPlatform, BrowserVersion = "latest" };
            safariOptions.AddAdditionalCapability("autoAcceptAlerts",true);
            safariOptions.AddAdditionalCapability("sauce:options", safariOptions);
            return new RemoteWebDriver(Uri, safariOptions);
        }

        public override IWebDriver InitialiseForLocal()
        {
            var safariOptions = new SafariOptions();
            safariOptions.AddAdditionalCapability("autoAcceptAlerts", true);
            return new SafariDriver(BuildPath,safariOptions, LocalTimeout);
        }
    }
}
