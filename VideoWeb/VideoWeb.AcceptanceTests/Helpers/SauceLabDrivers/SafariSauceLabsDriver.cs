using OpenQA.Selenium.Remote;
using OpenQA.Selenium.Safari;

namespace VideoWeb.AcceptanceTests.Helpers.SauceLabDrivers
{
    internal class SafariSauceLabsDriver : SaucelabsDriver
    {
        public override RemoteWebDriver Initialise()
        {
            // seleniumVersion is REQUIRED for any browser other than Chrome
            SauceOptions.Add("seleniumVersion", SeleniumVersion);
            var safariOptions = new SafariOptions() { PlatformName = "macOS 10.14", BrowserVersion = "latest" };
            safariOptions.AddAdditionalCapability("autoAcceptAlerts",true);
            safariOptions.AddAdditionalCapability("sauce:options", safariOptions);
            return new RemoteWebDriver(Uri, safariOptions);
        }
    }
}
