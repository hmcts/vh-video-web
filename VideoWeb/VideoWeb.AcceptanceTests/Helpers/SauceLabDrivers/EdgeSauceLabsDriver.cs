using OpenQA.Selenium.Edge;
using OpenQA.Selenium.Remote;

namespace VideoWeb.AcceptanceTests.Helpers.SauceLabDrivers
{
    internal class EdgeSauceLabsDriver : SaucelabsDriver
    {
        public override RemoteWebDriver Initialise()
        {
            var edgeOptions = new EdgeOptions() { PlatformName = "Windows 10", BrowserVersion = "latest", AcceptInsecureCertificates = true };
            edgeOptions.AddAdditionalCapability("dom.webnotifications.enabled", 1);
            edgeOptions.AddAdditionalCapability("permissions.default.microphone", 1);
            edgeOptions.AddAdditionalCapability("permissions.default.camera", 1);
            edgeOptions.AddAdditionalCapability("avoidProxy", 1);
            edgeOptions.AddAdditionalCapability("sauce:options", SauceOptions);
            return new RemoteWebDriver(Uri, edgeOptions);
        }
    }
}
