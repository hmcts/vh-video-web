using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Remote;

namespace VideoWeb.AcceptanceTests.Helpers.SauceLabDrivers
{
    internal class ChromeMacSauceLabsDriver : SaucelabsDriver
    {
        public override RemoteWebDriver Initialise()
        {
            var chromeOptions = new ChromeOptions
            {
                BrowserVersion = "latest",
                PlatformName = MacPlatform,
                UseSpecCompliantProtocol = true,
                AcceptInsecureCertificates = true
            };

            chromeOptions.AddArgument("use-fake-ui-for-media-stream");
            chromeOptions.AddArgument("use-fake-device-for-media-stream");
            chromeOptions.AddAdditionalCapability("sauce:options", SauceOptions, true);

            return new RemoteWebDriver(Uri, chromeOptions.ToCapabilities(), Timeout);
        }
    }
}
