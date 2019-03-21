using System;
using System.Collections.Concurrent;
using FluentAssertions;
using OpenQA.Selenium;
using Polly;
using Protractor;

namespace VideoWeb.AcceptanceTests.Helpers
{
    public class BrowserContext
    {

        private string _baseUrl;

        public NgWebDriver NgDriver;
        internal ContextItems Items { get; set; }

        public BrowserContext()
        {
            Items = new ContextItems(this);
        }

        public void BrowserSetup(string baseUrl, SeleniumEnvironment environment)
        {
            if (string.IsNullOrEmpty(baseUrl))
                throw new ArgumentNullException(nameof(baseUrl));

            var driver = environment.GetDriver();
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
                Console.WriteLine("Skipping maximize, not supported on current platform: " + e.Message);
            }
        }

        public void BrowserTearDown()
        {
            NgDriver.Quit();
            NgDriver.Dispose();
        }

        public string PageUrl() => NgDriver.Url;
        public string PageTitle => NgDriver.Title;

        public void LaunchSite()
        {
            if (string.IsNullOrEmpty(_baseUrl))
            {
                throw new InvalidOperationException("BaseUrl has not been set through BrowserSetup() yet");
            }

            Console.WriteLine($"Navigating to {_baseUrl}");
            NgDriver.WrappedDriver.Navigate().GoToUrl(_baseUrl);
        }

        internal void Retry(Action action, int times = 4)
        {
            Policy
                .Handle<Exception>()
                .WaitAndRetry(times, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)))
                .Execute(action);
        }

        public void WaitForAngular() => ((NgWebDriver)NgDriver).WaitForAngular();

        public void SwitchTab()
        {
            try
            {
                var originalTabPageTitle = PageTitle.Trim();
                var getAllWindowHandles = NgDriver.WindowHandles;
                var originalWindow = NgDriver.CurrentWindowHandle;
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
                Console.WriteLine($"Cannot switch to the main window:  {ex}");
            }
        }
        private By _pageTitle = By.XPath("//h1[@class='govuk-heading-l']");
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
            return (String)((IJavaScriptExecutor)NgDriver).ExecuteScript($"{script};");
        }
        public void AcceptAlert()
        {
            Retry(() => NgDriver.SwitchTo().Alert().Accept());
        }
    }

    internal class ContextItems
    {
        private ConcurrentDictionary<string, dynamic> _items;
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
            dynamic value;
            if (_items.TryGetValue(key, out value))
            {
                return value;
            }
            return null;
        }
    }
}
