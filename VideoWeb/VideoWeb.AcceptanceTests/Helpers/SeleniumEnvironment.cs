using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using FluentAssertions;
using NUnit.Framework;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Firefox;
using OpenQA.Selenium.Remote;
using TechTalk.SpecFlow;

namespace VideoWeb.AcceptanceTests.Helpers
{
    public class SeleniumEnvironment
    {
        private readonly SauceLabsSettings _saucelabsSettings;
        private readonly ScenarioInfo _scenario;
        private static TargetBrowser _targetBrowser;
        private const string JudgeVideo = "judge";
        private const string Individual1Video = "part1";
        private const string Representative1Video = "part2";
        private const string Individual2Video = "part3";
        private const string Representative2Video = "part4";

        public SeleniumEnvironment(SauceLabsSettings saucelabsSettings, ScenarioInfo scenario, TargetBrowser targetBrowser)
        {
            _saucelabsSettings = saucelabsSettings;
            _scenario = scenario;
            _targetBrowser = targetBrowser;
        }

        public IWebDriver GetDriver(string user)
        {
            string video;
            switch (user)
            {
                case "Judge": case "Judge01": video = JudgeVideo; break;
                case "Individual01": video = Individual1Video; break;
                case "Representative01": video = Representative1Video; break;
                case "Individual02": video = Individual2Video; break;
                case "Representative02": video = Representative2Video; break;
                default: throw new ArgumentOutOfRangeException($"No user defined; {user}");
            }
            return _saucelabsSettings.RunWithSaucelabs ? InitSauceLabsDriver(video) : InitLocalDriver(video,  _scenario);
        }

        private IWebDriver InitSauceLabsDriver(string video)
        {
#pragma warning disable 618
            // disable warning of using desired capabilities

            var caps = new DesiredCapabilities();
            switch (_targetBrowser)
            {
                case TargetBrowser.Firefox:
                    var profile = new FirefoxProfile();
                    profile.SetPreference("use-fake-ui-for-media-stream", true);
                    caps.SetCapability(FirefoxDriver.ProfileCapabilityName, profile);
                    caps.SetCapability("browserName", "Firefox");
                    caps.SetCapability("platform", "Windows 10");
                    caps.SetCapability("version", "latest");
                    caps.SetCapability("autoAcceptAlerts", true);
                    break;
                case TargetBrowser.Safari:
                    caps.SetCapability("browserName", "Safari");
                    caps.SetCapability("platform", "macOS 10.14");
                    caps.SetCapability("version", "12.0");
                    break;
                case TargetBrowser.Edge:
                    caps.SetCapability("browserName", "MicrosoftEdge");
                    caps.SetCapability("platform", "Windows 10");
                    caps.SetCapability("version", "16.16299");
                    caps.SetCapability("dom.webnotifications.enabled", 1);
                    caps.SetCapability("permissions.default.microphone", 1);
                    caps.SetCapability("permissions.default.camera", 1);
                    break;
                case TargetBrowser.IE11:
                    caps.SetCapability("browserName", "Internet Explorer");
                    caps.SetCapability("platform", "Windows 10");
                    caps.SetCapability("version", "11.285");
                    break;
                case TargetBrowser.IPhoneSafari:
                    caps.SetCapability("appiumVersion", "1.9.1");
                    caps.SetCapability("deviceName", "iPhone 8 Simulator");
                    caps.SetCapability("deviceOrientation", "portrait");
                    caps.SetCapability("platformVersion", "12.0");
                    caps.SetCapability("platformName", "iOS");
                    caps.SetCapability("browserName", "Safari");
                    break;
                default:
                    caps.SetCapability("browserName", "Chrome");
                    caps.SetCapability("platform", "Windows 10");
                    caps.SetCapability("version", "74.0");
                    caps.SetCapability("autoAcceptAlerts", true);
                    
                    var chromeOptions = new Dictionary<string, object>
                    {
                        ["args"] = new List<string>
                        {
                            "use-fake-ui-for-media-stream",
                            "use-fake-device-for-media-stream",
                            $"use-file-for-fake-video-capture={GetBuildPath}/Videos/{video}.y4m"
                        }
                    };
                    caps.SetCapability(ChromeOptions.Capability, chromeOptions);
                    break;
            }

            caps.SetCapability("name", _scenario.Title);
            caps.SetCapability("build", Environment.GetEnvironmentVariable("RELEASE_RELEASENAME"));
#pragma warning restore 618

            // It can take quite a bit of time for some commands to execute remotely so this is higher than default
            var commandTimeout = TimeSpan.FromMinutes(3);

            var remoteUrl = new System.Uri(_saucelabsSettings.RemoteServerUrl);

            return new RemoteWebDriver(remoteUrl, caps, commandTimeout);
        }

        private static IWebDriver InitLocalDriver(string video, ScenarioInfo scenario)
        {            
            var options = new ChromeOptions();
            options.AddArgument("ignore -certificate-errors");
            options.AddArgument("use-fake-ui-for-media-stream");
            options.AddArgument("use-fake-device-for-media-stream");
            if (scenario.Tags.Contains("Video"))
            {
                options.AddArgument($"use-file-for-fake-video-capture={GetBuildPath}/Videos/{video}.y4m");
            }       
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