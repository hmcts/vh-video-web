using System;
using Polly;
using Protractor;
using Testing.Common.Configuration;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;

namespace VideoWeb.AcceptanceTests.Users
{
    public class UserBrowser
    {
        private string _videoFileName;
        private readonly string _baseUrl;
        public NgWebDriver Driver { get; set; }
        private readonly SeleniumEnvironment _environment;
        public TargetBrowser TargetBrowser { get; set; }
        public string PageUrl() => Driver.Url;
        public string PageTitle => Driver.Title;
        public string LastWindowName { get; set; }

        public UserBrowser(UserAccount user, TestContext context)
        {
            SetFileName(user);
            _baseUrl = context.VideoWebUrl;
            _environment = context.Environment;
        }

        private void SetFileName(UserAccount user)
        {
            if (user.Role.Equals("Video Hearings Officer")) return;
            _videoFileName = user.Role.Equals("Judge") ? "clerk.y4m" : $"{user.Lastname.ToLower()}.y4m";
        }

        public void LaunchBrowser()
        {
            var driver = _environment.GetDriver(_videoFileName);
            Driver = new NgWebDriver(driver);
            TryMaximizeBrowser();
            Driver.IgnoreSynchronization = true;
        }

        private void TryMaximizeBrowser()
        {
            try
            {
                Driver.Manage().Window.Maximize();
            }
            catch (NotImplementedException e)
            {
                NUnit.Framework.TestContext.WriteLine("Skipping maximize, not supported on current platform: " + e.Message);
            }
        }

        public void NavigateToPage(string url = "")
        {
            if (string.IsNullOrEmpty(_baseUrl))
            {
                throw new InvalidOperationException("BaseUrl has not been set through BrowserSetup() yet");
            }

            NUnit.Framework.TestContext.WriteLine($"Navigating to {_baseUrl}{url}");
            Driver.WrappedDriver.Navigate().GoToUrl($"{_baseUrl}{url}");
        }

        internal void Retry(Action action, int times = 4)
        {
            Policy
                .Handle<Exception>()
                .WaitAndRetry(times, retryAttempt => TimeSpan.FromSeconds(Math.Pow(5, retryAttempt)))
                .Execute(action);

        }

        public void BrowserTearDown()
        {
            Driver.Quit();
            Driver.Dispose();
        }
    }
}
