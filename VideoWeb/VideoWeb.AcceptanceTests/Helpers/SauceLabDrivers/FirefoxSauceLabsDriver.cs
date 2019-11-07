﻿using OpenQA.Selenium.Firefox;
using OpenQA.Selenium.Remote;

namespace VideoWeb.AcceptanceTests.Helpers.SauceLabDrivers
{
    internal class FirefoxSauceLabsDriver : SaucelabsDriver
    {
        public override RemoteWebDriver Initialise()
        {
            var ffOptions = new FirefoxOptions { PlatformName = "Windows 10", BrowserVersion = "latest" };
            ffOptions.SetPreference("media.navigator.streams.fake", true);
            ffOptions.SetPreference("media.navigator.permission.disabled", true);

            // seleniumVersion is REQUIRED for any browser other than Chrome
            SauceOptions.Add("seleniumVersion", "3.141.59");

            ffOptions.AddAdditionalCapability("sauce:options", SauceOptions, true);

            return new RemoteWebDriver(Uri, ffOptions);
        }
    }
}
