﻿using System.Collections.Generic;
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
        public By SignOutMessage => CommonLocators.ElementContainingText("Signed out successfully");
        public By SignInLink => By.PartialLinkText("here");
        public By QuoteYourCaseNumberText => CommonLocators.ElementContainingText("Call us on");
        public By ContactUsLink => CommonLocators.ElementContainingText("Contact us for help");
        public By ContactUsEmail => CommonLocators.ElementContainingText("Send us a message");
        public By BetaBanner => CommonLocators.ElementContainingText("beta");
        public By ContactUsPhone(string phone) => CommonLocators.ElementContainingText(phone);

        public CommonPages(Dictionary<string, UserBrowser> browsers, TestContext testContext)
        {
            _browsers = browsers;
            _tc = testContext;
        }

        public bool TheCaseNumberIsDisplayedInTheContactDetails(string caseNumber)
        {
            return _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(QuoteYourCaseNumberText).Text.Contains($"and quote your case number {caseNumber}");
        }

        public void PageUrl(string page)
        {
            _browsers[_tc.CurrentUser.Key].Retry(() => _browsers[_tc.CurrentUser.Key].Driver.Url.Trim().Should().Contain(page), 2);
        }

        public void ClickWithJavascript(By element)
        {
            IJavaScriptExecutor js = (IJavaScriptExecutor)_browsers[_tc.CurrentUser.Key].Driver;
            js.ExecuteScript("arguments[0].click();", element);
        }
       

        public string GetElementText(By element) => _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(element).Text.Trim();  
    }
}
