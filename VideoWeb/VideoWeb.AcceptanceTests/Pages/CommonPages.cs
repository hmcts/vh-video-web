using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using OpenQA.Selenium;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class CommonPages
    {
        private readonly BrowserContext _browserContext;
        public By SignOutLink => By.PartialLinkText("Sign out");
        public By QuoteYourCaseNumberText => CommonLocators.ElementContainingText("Call us on");
        public By ContactUsLink => CommonLocators.ElementContainingText("Contact us for help");

        public CommonPages(BrowserContext browserContext)
        {
            _browserContext = browserContext;
        }

        public bool TheCaseNumberIsDisplayedInTheContactDetails(string caseNumber)
        {
            _browserContext.NgDriver.WaitUntilElementClickable(ContactUsLink).Click();
            return _browserContext.NgDriver.WaitUntilElementVisible(QuoteYourCaseNumberText).Text.Contains($"and quote your case number {caseNumber}");
        }

        public void PageUrl(Page page)
        {
            _browserContext.Retry(() => _browserContext.NgDriver.Url.Trim().Should().Contain(page.Url), 2);
        }

        public void ClickWithJavascript(By element)
        {
            IJavaScriptExecutor js = (IJavaScriptExecutor)_browserContext.NgDriver;
            js.ExecuteScript("arguments[0].click();", element);
        }
        
        protected IEnumerable<IWebElement> GetListOfElements(By elements)
        {
            IEnumerable<IWebElement> webElements = null;
            try
            {
                webElements = _browserContext.NgDriver.WaitUntilElementsVisible(elements);
            }
            catch (Exception ex)
            {
                webElements = _browserContext.NgDriver.FindElements(elements);
                NUnit.Framework.TestContext.WriteLine(ex);
            }
            return webElements;
        }
       
        protected void InputValues(By element, string value) => _browserContext.NgDriver.WaitUntilElementVisible(element).SendKeys(value);
        protected void ClickElement(By element) => _browserContext.NgDriver.WaitUntilElementVisible(element).Click();
        protected void ClearFieldInputValues(By element, string value)
        {
            var webElement = _browserContext.NgDriver.WaitUntilElementVisible(element);
            webElement.Clear();
            webElement.SendKeys(value);
        }

        public string GetElementText(By element) => _browserContext.NgDriver.WaitUntilElementVisible(element).Text.Trim();

        protected void SelectOption(By elements, string option)
        {
            var getListOfElements = GetListOfElements(elements);
            _browserContext.Retry(() => getListOfElements.AsEnumerable().Count().Should().BeGreaterThan(0, "List is not populated"));
            foreach (var element in getListOfElements)
            {
                if (option == element.Text.Trim())
                    _browserContext.NgDriver.WaitUntilElementClickable(element).Click();
            }
        }
        protected void SelectOption(By elements)
        {
            var getListOfElements = GetListOfElements(elements);
            _browserContext.Retry(() => getListOfElements.AsEnumerable().Count().Should().BeGreaterThan(0, "List is not populated"));
            _browserContext.NgDriver.WaitUntilElementClickable(getListOfElements.AsEnumerable().First()).Click();
        }
        protected string SelectLastItem(By elements)
        {
            var getListOfElements = GetListOfElements(elements);
            _browserContext.Retry(() => getListOfElements.AsEnumerable().Count().Should().BeGreaterThan(0, "List is not populated"));
            var lastItem = _browserContext.NgDriver.WaitUntilElementClickable(getListOfElements.AsEnumerable().Last());
            lastItem.Click();
            return lastItem.Text.Trim();
        }

        public void PageUrl(string url)
        {
            _browserContext.Retry(() => _browserContext.NgDriver.Url.Should().Contain(url));
        }

        public void AcceptBrowserAlert() => _browserContext.AcceptAlert();
        public void AddItems<T>(string key, T value) => _browserContext.Items.AddOrUpdate(key, value);
        public dynamic GetItems(string key) => _browserContext.Items.Get(key);
        protected IEnumerable<string> Items(By elements)
        {
            var webElements = _browserContext.NgDriver.WaitUntilElementsVisible(elements);
            return webElements.Select(element => element.Text.Trim()).ToList();
        }
        public void TopMenuHmctsLogo() => SelectOption(By.XPath("//*[@class='hmcts-header__logotype']"));
    }
}
