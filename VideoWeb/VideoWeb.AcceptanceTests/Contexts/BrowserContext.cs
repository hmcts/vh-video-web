using System;
using System.Collections.Concurrent;
using FluentAssertions;
using Microsoft.ApplicationInsights.WindowsServer;
using OpenQA.Selenium;
using Polly;
using Protractor;
using VideoWeb.AcceptanceTests.Helpers;

namespace VideoWeb.AcceptanceTests.Contexts
{
    public class BrowserContext
    {

        private string _baseUrl;

        public NgWebDriver NgDriver;
        public TargetBrowser TargetBrowser { get; set; }
        internal ContextItems Items { get; set; }

        public BrowserContext()
        {
            Items = new ContextItems(this);
        }

        public void BrowserSetup(string baseUrl, SeleniumEnvironment environment, string participant)
        {
            if (string.IsNullOrEmpty(baseUrl))
                throw new ArgumentNullException(nameof(baseUrl));

            var driver = environment.GetDriver(participant);
            NgDriver = new NgWebDriver(driver);
            TryMaximize();
            NgDriver.IgnoreSynchronization = true;
            _baseUrl = baseUrl;
        }

        public void TryMaximize()
        {
            try
            {
                NgDriver.Manage().Window.Maximize();
            }
            catch (NotImplementedException e)
            {
                
                NUnit.Framework.TestContext.WriteLine("Skipping maximize, not supported on current platform: " + e.Message);
            }
        }

        public void BrowserTearDown()
        {
            NgDriver.Quit();
            NgDriver.Dispose();
        }

        public string PageUrl() => NgDriver.Url;
        public string PageTitle => NgDriver.Title;

        public void NavigateToPage(string url = "")
        {
            if (string.IsNullOrEmpty(_baseUrl))
            {
                throw new InvalidOperationException("BaseUrl has not been set through BrowserSetup() yet");
            }

            NUnit.Framework.TestContext.WriteLine($"Navigating to {_baseUrl}{url}");
            NgDriver.WrappedDriver.Navigate().GoToUrl($"{_baseUrl}{url}");
        }

        internal void Retry(Action action, int times = 4)
        {
            Policy
                .Handle<Exception>()
                .WaitAndRetry(times, retryAttempt => TimeSpan.FromSeconds(Math.Pow(5, retryAttempt)))
                .Execute(action);

        }

        public void WaitForAngular() => NgDriver.WaitForAngular();

        public void SwitchTab()
        {
            try
            {
                var originalTabPageTitle = PageTitle.Trim();
                var getAllWindowHandles = NgDriver.WindowHandles;
                foreach (var windowHandle in getAllWindowHandles)
                {
                    NgDriver.SwitchTo().Window(windowHandle);
                    if (!originalTabPageTitle.Equals(NgDriver.Title.Trim()))
                    {
                        NgDriver.SwitchTo().Window(windowHandle);
                    }
                }
            }
            catch (Exception ex)
            {
                NUnit.Framework.TestContext.WriteLine($"Cannot switch to the main window:  {ex}");
            }
        }
        private readonly By _pageTitle = By.XPath("//h1[@class='govuk-heading-l']");
        public void ValidatePage(string url, string pageTitle, By webelement = null)
        {
            if (webelement == null)
                webelement = _pageTitle;
            Retry(() =>
            {
                WaitForAngular();
                NgDriver.Url.Should().Contain(url);
            });
            NgDriver.WaitUntilElementVisible(webelement).Text.Trim().Should().Contain(pageTitle);
        }

        public string ExecuteJavascript(string script)
        {
            return (string)((IJavaScriptExecutor)NgDriver).ExecuteScript($"{script};");
        }
        public void AcceptAlert()
        {
            Retry(() => NgDriver.SwitchTo().Alert().Accept());
        }
    }

    internal class ContextItems
    {
        private readonly ConcurrentDictionary<string, dynamic> _items;
        private readonly BrowserContext _context;

        public ContextItems(BrowserContext context)
        {
            _items = new ConcurrentDictionary<string, dynamic>();
            _context = context;
        }

        public void AddOrUpdate<T>(string key, T value)
        {
            try
            {
                _items.AddOrUpdate(key, value, (k, v) => value);
            }
            catch (Exception ex)
            {
                throw new ApplicationException($"Failed to add item with key {key} to context", ex);
            }
        }

        public dynamic Get(string key)
        {
            return _items.TryGetValue(key, out var value) ? value : null;
        }
    }
}
