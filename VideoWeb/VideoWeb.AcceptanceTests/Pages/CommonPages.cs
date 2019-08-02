using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using OpenQA.Selenium;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Users;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class CommonPages
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _tc;
        public By SignOutLink => By.PartialLinkText("Sign out");
        public By QuoteYourCaseNumberText => CommonLocators.ElementContainingText("Call us on");
        public By ContactUsLink => CommonLocators.ElementContainingText("Contact us for help");

        public CommonPages(Dictionary<string, UserBrowser> browsers, TestContext testContext)
        {
            _browsers = browsers;
            _tc = testContext;
        }

        public bool TheCaseNumberIsDisplayedInTheContactDetails(string caseNumber)
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementClickable(ContactUsLink).Click();
            return _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementVisible(QuoteYourCaseNumberText).Text.Contains($"and quote your case number {caseNumber}");
        }

        public void PageUrl(Page page)
        {
            _browsers[_tc.CurrentUser.Key].Retry(() => _browsers[_tc.CurrentUser.Key].Driver.Url.Trim().Should().Contain(page.Url), 2);
        }

        public void ClickWithJavascript(By element)
        {
            IJavaScriptExecutor js = (IJavaScriptExecutor)_browsers[_tc.CurrentUser.Key].Driver;
            js.ExecuteScript("arguments[0].click();", element);
        }
        
        protected IEnumerable<IWebElement> GetListOfElements(By elements)
        {
            IEnumerable<IWebElement> webElements = null;
            try
            {
                webElements = _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementsVisible(elements);
            }
            catch (Exception ex)
            {
                webElements = _browsers[_tc.CurrentUser.Key].Driver.FindElements(elements);
                NUnit.Framework.TestContext.WriteLine(ex);
            }
            return webElements;
        }
       
        protected void InputValues(By element, string value) => _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementVisible(element).SendKeys(value);
        protected void ClickElement(By element) => _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementVisible(element).Click();
        protected void ClearFieldInputValues(By element, string value)
        {
            var webElement = _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementVisible(element);
            webElement.Clear();
            webElement.SendKeys(value);
        }

        public string GetElementText(By element) => _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementVisible(element).Text.Trim();

        protected void SelectOption(By elements, string option)
        {
            var getListOfElements = GetListOfElements(elements);
            _browsers[_tc.CurrentUser.Key].Retry(() => getListOfElements.AsEnumerable().Count().Should().BeGreaterThan(0, "List is not populated"));
            foreach (var element in getListOfElements)
            {
                if (option == element.Text.Trim())
                    _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementClickable(element).Click();
            }
        }
        protected void SelectOption(By elements)
        {
            var getListOfElements = GetListOfElements(elements);
            _browsers[_tc.CurrentUser.Key].Retry(() => getListOfElements.AsEnumerable().Count().Should().BeGreaterThan(0, "List is not populated"));
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementClickable(getListOfElements.AsEnumerable().First()).Click();
        }
        protected string SelectLastItem(By elements)
        {
            var getListOfElements = GetListOfElements(elements);
            _browsers[_tc.CurrentUser.Key].Retry(() => getListOfElements.AsEnumerable().Count().Should().BeGreaterThan(0, "List is not populated"));
            var lastItem = _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementClickable(getListOfElements.AsEnumerable().Last());
            lastItem.Click();
            return lastItem.Text.Trim();
        }

        public void PageUrl(string url)
        {
            _browsers[_tc.CurrentUser.Key].Retry(() => _browsers[_tc.CurrentUser.Key].Driver.Url.Should().Contain(url));
        }       
    }
}
