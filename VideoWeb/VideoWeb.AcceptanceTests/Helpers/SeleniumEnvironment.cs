using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using OpenQA.Selenium;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers.Drivers;

namespace VideoWeb.AcceptanceTests.Helpers
{
    public class SeleniumEnvironment
    {
        private readonly SauceLabsSettings _saucelabsSettings;
        private readonly ScenarioInfo _scenario;
        private static TargetBrowser _targetBrowser;
        private const string WindowsScreenResolution = "2560x1600";
        private const string MacScreenResolution = "2360x1770";
        private const int SaucelabsIdleTimeoutInSeconds = 60 * 30;
        private const int SaucelabsCommandTimeoutInSeconds = 60 * 3;
        private const int LocalCommandTimeoutInSeconds = 20;
        private const string SauceLabSeleniumVersion = "3.141.59";
        private const string SauceLabsMacPlatformVersion = "macOS 10.14";
        private const string OsxPath = "/usr/local/bin";

        public SeleniumEnvironment(SauceLabsSettings saucelabsSettings, ScenarioInfo scenario, TargetBrowser targetBrowser)
        {
            _saucelabsSettings = saucelabsSettings;
            _scenario = scenario;
            _targetBrowser = targetBrowser;
        }

        public IWebDriver GetDriver(string filename)
        {
            return _saucelabsSettings.RunWithSaucelabs ? InitialiseSauceLabsDriver() : InitialiseLocalDriver(filename,  _scenario);
        }

        private IWebDriver InitialiseSauceLabsDriver()
        {
            var buildName = Environment.GetEnvironmentVariable("Build_DefinitionName");
            var releaseName = Environment.GetEnvironmentVariable("RELEASE_RELEASENAME");
            var shortBuildName = buildName?.Replace("hmcts.vh-", "");
            var sauceOptions = new Dictionary<string, object>
            {
                {"username", _saucelabsSettings.Username},
                {"accessKey", _saucelabsSettings.AccessKey},
                {"name", _scenario.Title},
                {"build", $"{shortBuildName} {releaseName} {_targetBrowser}"},
                {"idleTimeout", SaucelabsIdleTimeoutInSeconds},
                {"seleniumVersion", SauceLabSeleniumVersion},
                {
                    "screenResolution", _targetBrowser == TargetBrowser.Safari
                        ? MacScreenResolution
                        : WindowsScreenResolution
                }
            };

            var drivers = GetDrivers();
            drivers[_targetBrowser].MacPlatform = SauceLabsMacPlatformVersion;
            drivers[_targetBrowser].SauceOptions = sauceOptions;
            drivers[_targetBrowser].IdleTimeout = TimeSpan.FromSeconds(SaucelabsIdleTimeoutInSeconds);
            drivers[_targetBrowser].SaucelabsTimeout = TimeSpan.FromSeconds(SaucelabsCommandTimeoutInSeconds);
            drivers[_targetBrowser].Uri = new Uri(_saucelabsSettings.RemoteServerUrl);
            return drivers[_targetBrowser].InitialiseForSauceLabs();
        }

        private static IWebDriver InitialiseLocalDriver(string filename, ScenarioInfo scenario)
        {
            var drivers = GetDrivers();
            drivers[_targetBrowser].SaucelabsTimeout = TimeSpan.FromSeconds(SaucelabsCommandTimeoutInSeconds);
            drivers[_targetBrowser].BuildPath = Directory.Exists(OsxPath) ? OsxPath : Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
            drivers[_targetBrowser].Filename = filename;
            drivers[_targetBrowser].UseVideoFiles = scenario.Tags.Contains("Video");
            drivers[_targetBrowser].LocalTimeout = TimeSpan.FromSeconds(LocalCommandTimeoutInSeconds);
            return drivers[_targetBrowser].InitialiseForLocal();
        }

        private static Dictionary<TargetBrowser, Drivers.Drivers> GetDrivers()
        {
            var drivers = new Dictionary<TargetBrowser, Drivers.Drivers>
            {
                {TargetBrowser.Chrome, new ChromeDriverStrategy()},
                {TargetBrowser.Firefox, new FirefoxDriverStrategy()},
                {TargetBrowser.Edge, new EdgeDriverStrategy()},
                {TargetBrowser.Ie11, new InternetExplorerDriverStrategy()},
                {TargetBrowser.Safari, new SafariDriverStrategy()},
                {TargetBrowser.ChromeMac, new ChromeMacDriverStrategy()},
                {TargetBrowser.FirefoxMac, new FirefoxMacDriverStrategy()}
            };
            return drivers;
        }
    }
}