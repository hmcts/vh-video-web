using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.AcceptanceTests.Users;
using TestContext = VideoWeb.AcceptanceTests.Contexts.TestContext;
using Selenium.Axe;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class CommonSteps
    {
        private readonly TestContext _tc;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly CommonPages _commonPages;

        public CommonSteps(TestContext testContext, Dictionary<string, UserBrowser> browsers, CommonPages commonPages)
        {
            _tc = testContext;
            _browsers = browsers;
            _commonPages = commonPages;
        }

        [Given(@"a new browser is open for user (.*)")]
        [Given(@"a new browser is open for the (.*)")]
        [Given(@"a new browser is open for a (.*)")]
        [Given(@"a new browser is open for an (.*)")]
        public void GivenANewBrowserIsOpenFor(string user)
        {
            SwitchCurrentUser(user);

            var browser = new UserBrowser(_tc.CurrentUser, _tc);
            _browsers.Add(_tc.CurrentUser.Key, browser);

            browser.LaunchBrowser();
            browser.NavigateToPage();

            browser.Retry(() => browser.PageUrl().Should().Contain("login.microsoftonline.com"), 10);
        }

        [Given(@"in (.*)'s browser")]
        [When(@"in (.*)'s browser")]
        [Then(@"in (.*)'s browser")]
        public void GivenInTheUsersBrowser(string user)
        {
            user = user.Replace("the ", "");

            SwitchCurrentUser(user);

            _browsers[_tc.CurrentUser.Key].Driver.SwitchTo().Window(_browsers[_tc.CurrentUser.Key].LastWindowName);
        }

        private void SwitchCurrentUser(string user)
        {
            if (_tc.CurrentUser != null)
                _browsers[_tc.CurrentUser.Key].LastWindowName =
                    _browsers[_tc.CurrentUser.Key].Driver.WrappedDriver.WindowHandles.Last();

            _tc.CurrentUser = user.ToLower().Equals("participant") ? _tc.TestSettings.UserAccounts.First(x => x.Lastname.ToLower().Equals(_tc.DefaultParticipant.Lastname.ToLower())) : _tc.TestSettings.UserAccounts.First(x => x.Displayname.ToLower().Contains(user.ToLower().Replace(" ", "")));          

            if (_tc.CurrentUser == null)
                throw new ArgumentOutOfRangeException($"There are no users configured called '{user}'");
        }

        [When(@"the user clicks the (.*) button")]
        public void WhenTheUserClicksTheButton(string label)
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(CommonLocators.ButtonWithInnertext(label))
                .Displayed.Should().BeTrue();

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(CommonLocators.ButtonWithInnertext(label)).Click();
        }

        [When(@"the user selects the (.*) radiobutton")]
        public void WhenTheUserSelectsTheRadiobutton(string label)
        {            
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementExists(CommonLocators.RadioButtonWithLabel(label)).Click();

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementExists(CommonLocators.RadioButtonWithLabel(label)).Selected
                .Should().BeTrue();
        }

        [When(@"the user clicks the (.*) link")]
        public void WhenTheUserClicksTheChangeCameraOrMicrophoneLink(string linktext)
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(CommonLocators.LinkWithText(linktext)).Displayed
                .Should().BeTrue();

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(CommonLocators.LinkWithText(linktext)).Click();
        }

        [Then(@"contact us details are available")]
        public void ThenContactUsDetailsWillBeAvailable()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_commonPages.ContactUsLink)
                .Displayed.Should().BeTrue();

            if (!_browsers[_tc.CurrentUser.Key].Driver.Url.Contains(Page.HearingList.Url)) return;

            if (_tc.Hearing != null)
            {
                _commonPages.TheCaseNumberIsDisplayedInTheContactDetails(_tc.Hearing.Cases.First().Number)
                    .Should().BeFalse();
            }
        }

        [Then(@"the user is on the (.*) page")]
        public void ThenTheUserIsOnThePage(string page)
        {
            _commonPages.PageUrl(Page.FromString(page).Url);
        }

        [Then(@"the (.*) error message appears")]
        public void ThenTheErrorMessageAppears(string errorText)
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(CommonLocators.ErrorMessage).Text.Replace("Error:", "")
                .Should().Contain(errorText);
        }

        [Then(@"the (.*) button is disabled")]
        public void ThenTheButtonIsDisabled(string label)
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(CommonLocators.ButtonWithInnertext(label)).GetAttribute("class")
                .Should().Contain("disabled");
        }

        [Then(@"the page should be accessible")]
        public void ThenThePageShouldBeAccessible()
        {
            var axeResult = new AxeBuilder(_browsers[_tc.CurrentUser.Key].Driver)
                .DisableRules( // BUG: Once VIH-5174 bug is fixed, remove these exclusions
                    "region", // https://dequeuniversity.com/rules/axe/3.3/region?application=axeAPI
                    "landmark-one-main", // https://dequeuniversity.com/rules/axe/3.3/landmark-one-main?application=axeAPI
                    "landmark-no-duplicate-banner", // https://dequeuniversity.com/rules/axe/3.3/landmark-no-duplicate-banner?application=axeAPI
                    "landmark-no-duplicate-contentinfo", // https://dequeuniversity.com/rules/axe/3.3/landmark-no-duplicate-contentinfo?application=axeAPI
                    "page-has-heading-one", // https://dequeuniversity.com/rules/axe/3.3/page-has-heading-one?application=axeAPI
                    "landmark-unique") // https://dequeuniversity.com/rules/axe/3.3/landmark-unique?application=axeAPI
                .Analyze();
            axeResult.Violations.Should().BeEmpty();
        }
    }
}

