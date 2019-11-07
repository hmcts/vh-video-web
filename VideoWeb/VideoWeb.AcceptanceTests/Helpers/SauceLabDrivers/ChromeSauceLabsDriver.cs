using System;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Remote;

namespace VideoWeb.AcceptanceTests.Helpers.SauceLabDrivers
{
    internal class ChromeSauceLabsDriver : SaucelabsDriver
    {
        public override RemoteWebDriver Initialise()
        {
            var chromeOptions = new ChromeOptions()
            {
                BrowserVersion = "latest",
                PlatformName = "Windows 10",
                UseSpecCompliantProtocol = true
            };

            chromeOptions.AddArgument("use-fake-ui-for-media-stream");
            chromeOptions.AddArgument("use-fake-device-for-media-stream");


            chromeOptions.AddAdditionalCapability("sauce:options", SauceOptions, true);

            return new RemoteWebDriver(Uri, chromeOptions.ToCapabilities(), Timeout);
        }
    }
}
