using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using OpenQA.Selenium;
using VideoWeb.AcceptanceTests.Helpers;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class CommonPages
    {
        private readonly BrowserContext _browserContext;
        public CommonPages(BrowserContext browserContext)
        {
            _browserContext = browserContext;
        }

        private By _breadcrumbs => By.XPath("//li[@class='vh-breadcrumbs']/a");
        private By _nextButton => By.Id(("nextButton"));
        private By _cancelButton => By.Id(("cancelButton"));
        private By _primaryNavItems => By.XPath("//*[@class='vh-primary-navigation__link']");
        public By SignOutLink => By.PartialLinkText("Sign out");

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
                Console.WriteLine(ex);
            }
            return webElements;
        }
        protected string GetBreadcrumbAttribute(string breadcrumb)
        {
            var getListOfElements = GetListOfElements(_breadcrumbs);
            string breadcrumbAttribute = null;
            foreach (var element in getListOfElements)
            {
                if (breadcrumb == element.Text)
                    breadcrumbAttribute = element.GetAttribute("class");
            }
            return breadcrumbAttribute;
        }

        protected void InputValues(By element, string value) => _browserContext.NgDriver.WaitUntilElementVisible(element).SendKeys(value);
        protected void ClickElement(By element) => _browserContext.NgDriver.WaitUntilElementVisible(element).Click();
        protected void ClearFieldInputValues(By element, string value)
        {
            var webElement = _browserContext.NgDriver.WaitUntilElementVisible(element);
            webElement.Clear();
            webElement.SendKeys(value);
        }
        public void NextButton()
        {
            _browserContext.Retry(() => _browserContext.NgDriver.WaitUntilElementClickable(_nextButton).Click());
        }
        public void CancelButton() => _browserContext.NgDriver.WaitUntilElementClickable(_cancelButton).Click();
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

        public void ClickBreadcrumb(string breadcrumb) => SelectOption(_breadcrumbs, breadcrumb);
        public void AcceptBrowserAlert() => _browserContext.AcceptAlert();
        public void DashBoard() => SelectOption(_primaryNavItems, "Dashboard");
        public void BookingsList() => SelectOption(_primaryNavItems, "Bookings list");
        public void AddItems<T>(string key, T value) => _browserContext.Items.AddOrUpdate(key, value);
        public dynamic GetItems(string key) => _browserContext.Items.Get(key);
        public string GetParticipantDetails() => GetElementText(By.XPath("//*[@class='govuk-grid-column-two-thirds vhtable-header']"));
        protected IEnumerable<string> Items(By elements)
        {
            var webElements = _browserContext.NgDriver.WaitUntilElementsVisible(elements);
            IList<string> list = new List<string>();
            foreach (var element in webElements)
            {
                list.Add(element.Text.Trim());
            }
            return list;
        }
        public void TopMenuHmctsLogo() => SelectOption(By.XPath("//*[@class='hmcts-header__logotype']"));
    }
}
