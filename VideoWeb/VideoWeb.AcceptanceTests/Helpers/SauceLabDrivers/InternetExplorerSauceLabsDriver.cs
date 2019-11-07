using OpenQA.Selenium.IE;
using OpenQA.Selenium.Remote;

namespace VideoWeb.AcceptanceTests.Helpers.SauceLabDrivers
{
    internal class InternetExplorerSauceLabsDriver : SaucelabsDriver
    {
        public override RemoteWebDriver Initialise()
        {
            var ieOptions = new InternetExplorerOptions() { PlatformName = "Windows 10", BrowserVersion = "latest", AcceptInsecureCertificates = true };
            ieOptions.AddAdditionalCapability("sauce:options", SauceOptions);
            return new RemoteWebDriver(Uri, ieOptions);
        }
    }
}
