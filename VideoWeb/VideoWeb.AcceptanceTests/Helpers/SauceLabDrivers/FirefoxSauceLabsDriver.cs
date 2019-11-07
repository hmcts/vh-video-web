using OpenQA.Selenium.Firefox;
using OpenQA.Selenium.Remote;

namespace VideoWeb.AcceptanceTests.Helpers.SauceLabDrivers
{
    internal class FirefoxSauceLabsDriver : SaucelabsDriver
    {
        public override RemoteWebDriver Initialise()
        {
            var ffOptions = new FirefoxOptions { PlatformName = "Windows 10", BrowserVersion = "latest", AcceptInsecureCertificates = true };
            ffOptions.SetPreference("media.navigator.streams.fake", true);
            ffOptions.SetPreference("media.navigator.permission.disabled", true);
            ffOptions.AddAdditionalCapability("sauce:options", SauceOptions, true);
            return new RemoteWebDriver(Uri, ffOptions);
        }
    }
}
