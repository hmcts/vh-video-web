using OpenQA.Selenium.IE;
using OpenQA.Selenium.Remote;

namespace VideoWeb.AcceptanceTests.Helpers.SauceLabDrivers
{
    internal class InternetExplorerSauceLabsDriver : SaucelabsDriver
    {
        public override RemoteWebDriver Initialise()
        {
            // seleniumVersion is REQUIRED for any browser other than Chrome
            SauceOptions.Add("seleniumVersion", SeleniumVersion);
            var ieOptions = new InternetExplorerOptions() { PlatformName = "Windows 10", BrowserVersion = "latest" };
            ieOptions.AddAdditionalCapability("sauce:options", SauceOptions);
            return new RemoteWebDriver(Uri, ieOptions);
        }
    }
}
