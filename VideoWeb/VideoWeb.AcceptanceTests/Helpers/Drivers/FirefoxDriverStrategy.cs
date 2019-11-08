using OpenQA.Selenium;
using OpenQA.Selenium.Firefox;
using OpenQA.Selenium.Remote;

namespace VideoWeb.AcceptanceTests.Helpers.Drivers
{
    internal class FirefoxDriverStrategy : Drivers
    {
        public override RemoteWebDriver InitialiseForSauceLabs()
        {
            var ffOptions = new FirefoxOptions { PlatformName = "Windows 10", BrowserVersion = "latest", AcceptInsecureCertificates = true };
            ffOptions.SetPreference("media.navigator.streams.fake", true);
            ffOptions.SetPreference("media.navigator.permission.disabled", true);
            ffOptions.AddAdditionalCapability("sauce:options", SauceOptions, true);
            return new RemoteWebDriver(Uri, ffOptions);
        }

        public override IWebDriver InitialiseForLocal()
        {
            var ffOptions = new FirefoxOptions(){ AcceptInsecureCertificates = true };
            ffOptions.SetPreference("media.navigator.streams.fake", true);
            ffOptions.SetPreference("media.navigator.permission.disabled", true);
            return new FirefoxDriver(BuildPath, ffOptions, LocalTimeout);
        }
    }
}
