using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Remote;

namespace VideoWeb.AcceptanceTests.Helpers.Drivers
{
    internal class ChromeMacDriverStrategy : Drivers
    {
        public override RemoteWebDriver InitialiseForSauceLabs()
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

            return new RemoteWebDriver(Uri, chromeOptions.ToCapabilities(), SaucelabsTimeout);
        }

        public override IWebDriver InitialiseForLocal()
        {
            var chromeOptions = new ChromeOptions();
            chromeOptions.AddArgument("ignore-certificate-errors");
            chromeOptions.AddArgument("use-fake-ui-for-media-stream");
            chromeOptions.AddArgument("use-fake-device-for-media-stream");
            if (UseVideoFiles)
                chromeOptions.AddArgument($"use-file-for-fake-video-capture={BuildPath}/Videos/{Filename}");
            return new ChromeDriver(BuildPath, chromeOptions, LocalTimeout);
        }
    }
}
