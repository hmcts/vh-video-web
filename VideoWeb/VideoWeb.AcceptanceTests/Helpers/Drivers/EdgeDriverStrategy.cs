using OpenQA.Selenium;
using OpenQA.Selenium.Edge;
using OpenQA.Selenium.Remote;

namespace VideoWeb.AcceptanceTests.Helpers.Drivers
{
    internal class EdgeDriverStrategy : Drivers
    {
        public override RemoteWebDriver InitialiseForSauceLabs()
        {
            var edgeOptions = new EdgeOptions() { PlatformName = "Windows 10", BrowserVersion = "latest" };
            edgeOptions.AddAdditionalCapability("dom.webnotifications.enabled", 1);
            edgeOptions.AddAdditionalCapability("permissions.default.microphone", 1);
            edgeOptions.AddAdditionalCapability("permissions.default.camera", 1);
            edgeOptions.AddAdditionalCapability("avoidProxy", true);
            edgeOptions.AddAdditionalCapability("sauce:options", SauceOptions);
            return new RemoteWebDriver(Uri, edgeOptions);
        }

        public override IWebDriver InitialiseForLocal()
        {
            var edgeDriverService = EdgeDriverService.CreateDefaultService(
                BuildPath, "MicrosoftWebDriver.exe", 52296);
            var edgeOptions = new EdgeOptions
            {
                UnhandledPromptBehavior = UnhandledPromptBehavior.Accept,
                UseInPrivateBrowsing = true
            };
            return new EdgeDriver(edgeDriverService, edgeOptions, LocalTimeout);
        }
    }
}
