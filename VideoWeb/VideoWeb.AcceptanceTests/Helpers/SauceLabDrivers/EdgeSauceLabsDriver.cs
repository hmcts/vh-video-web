using OpenQA.Selenium.Edge;
using OpenQA.Selenium.Remote;

namespace VideoWeb.AcceptanceTests.Helpers.SauceLabDrivers
{
    internal class EdgeSauceLabsDriver : SaucelabsDriver
    {
        public override RemoteWebDriver Initialise()
        {
            // seleniumVersion is REQUIRED for any browser other than Chrome
            SauceOptions.Add("seleniumVersion", SeleniumVersion);
            
            var edgeOptions = new EdgeOptions() { PlatformName = "Windows 10", BrowserVersion = "latest"};
            edgeOptions.AddAdditionalCapability("dom.webnotifications.enabled", 1);
            edgeOptions.AddAdditionalCapability("permissions.default.microphone", 1);
            edgeOptions.AddAdditionalCapability("permissions.default.camera", 1);
            edgeOptions.AddAdditionalCapability("avoidProxy", 1);
            edgeOptions.AddAdditionalCapability("sauce:options", SauceOptions);
            return new RemoteWebDriver(Uri, edgeOptions);
        }
    }
}
