using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using NUnit.Framework;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers.SauceLabDrivers;

namespace VideoWeb.AcceptanceTests.Helpers
{
    public class SeleniumEnvironment
    {
        private readonly SauceLabsSettings _saucelabsSettings;
        private readonly ScenarioInfo _scenario;
        private static TargetBrowser _targetBrowser;
        private const string SaucelabsWindowsScreenResolution = "2560x1600";
        private const string SaucelabsMacScreenResolution = "2360x1770";
        private const int SaucelabsIdleTimeoutInSeconds = 60 * 30;
        private const int SaucelabsCommandTimeoutInSeconds = 60 * 3;
        private const string SauceLabSeleniumVersion = "3.141.59";

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
            var buildName = $"{Environment.GetEnvironmentVariable("Build_DefinitionName")} {Environment.GetEnvironmentVariable("RELEASE_RELEASENAME")}";
            var sauceOptions = new Dictionary<string, object>
            {
                {"username", _saucelabsSettings.Username},
                {"accessKey", _saucelabsSettings.AccessKey},
                {"name", _scenario.Title},
                {"build", buildName},
                {"idleTimeout", SaucelabsIdleTimeoutInSeconds},
                {"seleniumVersion", SauceLabSeleniumVersion},
                {
                    "screenResolution", _targetBrowser == TargetBrowser.Safari
                        ? SaucelabsMacScreenResolution
                        : SaucelabsWindowsScreenResolution
                }
            };

            var drivers = new Dictionary<TargetBrowser, SaucelabsDriver>
            {
                {TargetBrowser.Chrome, new ChromeSauceLabsDriver()},
                {TargetBrowser.Firefox, new FirefoxSauceLabsDriver()},
                {TargetBrowser.Edge, new EdgeSauceLabsDriver()},
                {TargetBrowser.IE11, new InternetExplorerSauceLabsDriver()},
                {TargetBrowser.Safari, new SafariSauceLabsDriver()}
            };

            drivers[_targetBrowser].SauceOptions = sauceOptions;
            drivers[_targetBrowser].IdleTimeout = TimeSpan.FromSeconds(SaucelabsIdleTimeoutInSeconds);
            drivers[_targetBrowser].Timeout = TimeSpan.FromSeconds(SaucelabsCommandTimeoutInSeconds);
            drivers[_targetBrowser].Uri = new Uri(_saucelabsSettings.RemoteServerUrl);
            
            return drivers[_targetBrowser].Initialise();
        }

        private static IWebDriver InitialiseLocalDriver(string filename, ScenarioInfo scenario)
        {            
            var options = new ChromeOptions();
            options.AddArgument("ignore-certificate-errors");
            options.AddArgument("use-fake-ui-for-media-stream");
            options.AddArgument("use-fake-device-for-media-stream");
            if (scenario.Tags.Contains("Video"))
                options.AddArgument($"use-file-for-fake-video-capture={GetBuildPath}/Videos/{filename}");
            var commandTimeout = TimeSpan.FromSeconds(30);
            _targetBrowser = TargetBrowser.Chrome;
            return new ChromeDriver(GetBuildPath, options, commandTimeout);
        }

        private static string GetBuildPath
        {
            get
            {
                const string osxPath = "/usr/local/bin";
                var assemblyPath = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
                var path = Directory.Exists(osxPath) ? osxPath : assemblyPath;
                TestContext.WriteLine($"looking for local build path {path}");
                return assemblyPath;
            }
        }
    }
}