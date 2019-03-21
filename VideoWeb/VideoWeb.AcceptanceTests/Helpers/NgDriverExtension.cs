using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;
using Protractor;

namespace VideoWeb.AcceptanceTests.Helpers
{
    public static class NgDriverExtension
    {
        public static NgWebElement FindElement(this ISearchContext context, By by, int timeout = 20, bool displayed = false)
        {
            var wait = new DefaultWait<ISearchContext>(context)
            { Timeout = TimeSpan.FromSeconds(timeout) };
            wait.IgnoreExceptionTypes(typeof(NoSuchElementException));
            return wait.Until(ctx => {
                var elem = ctx.FindElement(by);
                if (displayed && !elem.Displayed)
                    return null;

                return ((NgWebElement)(elem));
            });
        }
        public static ReadOnlyCollection<IWebElement> FindElements(this IWebDriver driver, By elementLocator, int timeout = 10)
        {
            try
            {
                var wait = new WebDriverWait(driver, TimeSpan.FromSeconds(timeout));
                return wait.Until(SeleniumExtras.WaitHelpers.ExpectedConditions.VisibilityOfAllElementsLocatedBy(elementLocator));
            }
            catch (NoSuchElementException ex)
            {
                throw new NoSuchElementException($"Element with locator: '{elementLocator}' was not found in current context page.", ex);
            }
        }
        public static IWebElement WaitUntilElementClickable(this IWebDriver driver, By elementLocator, int timeout = 20)
        {
            try
            {
                var wait = new WebDriverWait(driver, TimeSpan.FromSeconds(timeout));
                return wait.Until(SeleniumExtras.WaitHelpers.ExpectedConditions.ElementToBeClickable(elementLocator));
            }
            catch (NoSuchElementException ex)
            {
                throw new NoSuchElementException($"Element with locator: '{elementLocator}' was not found in current context page.", ex);
            }
        }

        public static IWebElement WaitUntilElementClickable(this IWebDriver driver, IWebElement element, int timeout = 20)
        {
            try
            {
                var wait = new WebDriverWait(driver, TimeSpan.FromSeconds(timeout));
                return wait.Until(SeleniumExtras.WaitHelpers.ExpectedConditions.ElementToBeClickable(element));
            }
            catch (NoSuchElementException ex)
            {
                throw new NoSuchElementException($"Element with TagName: '{element.TagName}' was not found in current context page.", ex);
            }
        }


        public static void WaitUntilTextPresent(this IWebDriver driver, IWebElement element, string text, int timeout = 20)
        {
            try
            {
                var wait = new WebDriverWait(driver, TimeSpan.FromSeconds(timeout));
                wait.Until(SeleniumExtras.WaitHelpers.ExpectedConditions.TextToBePresentInElement(element, text));
            }
            catch (NoSuchElementException ex)
            {
                throw new NoSuchElementException($"Element with tagname: '{element.TagName}' was not found in current context page with text {text}.", ex);
            }
        }

        public static IWebElement WaitUntilElementExists(this IWebDriver driver, By elementLocator, int timeout = 20)
        {
            try
            {
                var wait = new WebDriverWait(driver, TimeSpan.FromSeconds(timeout));
                return wait.Until(SeleniumExtras.WaitHelpers.ExpectedConditions.ElementExists(elementLocator));
            }
            catch (NoSuchElementException ex)
            {
                throw new NoSuchElementException($"Element with locator: '{elementLocator}' was not found in current context page.", ex);
            }
        }

        public static bool WaitUntilElementNotVisible(this IWebDriver driver, By elementLocator, int timeout = 20)
        {
            try
            {
                var wait = new WebDriverWait(driver, TimeSpan.FromSeconds(timeout));
                return wait.Until(SeleniumExtras.WaitHelpers.ExpectedConditions.InvisibilityOfElementLocated(elementLocator));
            }
            catch (NoSuchElementException ex)
            {
                throw new NoSuchElementException($"Element with locator: '{elementLocator}' was not found in current context page.", ex);
            }
        }
        public static IWebElement WaitUntilElementVisible(this IWebDriver driver, By elementLocator, int timeout = 30)
        {
            try
            {
                var wait = new WebDriverWait(driver, TimeSpan.FromSeconds(timeout));
                return wait.Until(SeleniumExtras.WaitHelpers.ExpectedConditions.ElementIsVisible(elementLocator));
            }
            catch (NoSuchElementException ex)
            {
                throw new NoSuchElementException($"Element with locator: '{elementLocator}' was not found in current context page.", ex);
            }
        }

        public static IList<IWebElement> WaitUntilElementsVisible(this IWebDriver driver, By elementLocator, int timeout = 30)
        {
            try
            {
                var wait = new WebDriverWait(driver, TimeSpan.FromSeconds(timeout));
                return wait.Until(SeleniumExtras.WaitHelpers.ExpectedConditions.PresenceOfAllElementsLocatedBy(elementLocator));
            }
            catch (NoSuchElementException ex)
            {
                throw new NoSuchElementException($"Element with locator: '{elementLocator}' was not found in current context page.", ex);
            }
        }

        public static void ClickAndWaitForPageToLoad(this IWebDriver driver, By elementLocator, int timeout = 10)
        {
            try
            {
                var wait = new WebDriverWait(driver, TimeSpan.FromSeconds(timeout));
                var element = driver.FindElement(elementLocator);
                element.Click();
                wait.Until(SeleniumExtras.WaitHelpers.ExpectedConditions.StalenessOf(element));
            }
            catch (NoSuchElementException ex)
            {
                throw new NoSuchElementException($"Element with locator: '{elementLocator}' was not found in current context page.", ex);
            }
        }
    }
}
