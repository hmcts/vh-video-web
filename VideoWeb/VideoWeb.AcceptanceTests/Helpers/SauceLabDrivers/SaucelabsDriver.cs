using System;
using System.Collections.Generic;
using OpenQA.Selenium.Remote;

namespace VideoWeb.AcceptanceTests.Helpers.SauceLabDrivers
{
    public abstract class SaucelabsDriver
    {
        internal TimeSpan IdleTimeout { get; set; }
        internal Dictionary<string, object> SauceOptions { get; set; }
        internal Uri Uri { get; set; }
        internal TimeSpan Timeout { get; set; }

        public abstract RemoteWebDriver Initialise();
    }
}
