using System;
using System.Collections.Generic;
using System.Linq;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Support;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class BrowserSteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<string, UserBrowser> _browsers;

        public BrowserSteps(TestContext testContext, Dictionary<string, UserBrowser> browsers)
        {
            _c = testContext;
            _browsers = browsers;
        }

        [Given(@"a new browser is open for user (.*)")]
        [Given(@"a new browser is open for the (.*)")]
        [Given(@"a new browser is open for a (.*)")]
        [Given(@"a new browser is open for an (.*)")]
        public void GivenANewBrowserIsOpenFor(string user)
        {
            SwitchCurrentUser(user);

            var browser = new UserBrowser(_c.CurrentUser)
                .SetBaseUrl(_c.VideoWebConfig.VhServices.VideoWebUrl)
                .SetDriver(_c.Driver);

            _browsers.Add(_c.CurrentUser.Key, browser);

            browser.LaunchBrowser();
            browser.NavigateToPage();

            if (_c.VideoWebConfig.TestConfig.TargetBrowser != TargetBrowser.Ie11)
                browser.PageUrl(_c.Test.CommonData.CommonUris.LoginUri);
        }

        [Given(@"in (.*)'s browser")]
        [When(@"in (.*)'s browser")]
        [Then(@"in (.*)'s browser")]
        public void GivenInTheUsersBrowser(string user)
        {
            SwitchCurrentUser(user.Replace("the ", ""));
            _browsers[_c.CurrentUser.Key].Driver.SwitchTo().Window(_browsers[_c.CurrentUser.Key].LastWindowName);
        }

        private void SwitchCurrentUser(string user)
        {
            if (_c.CurrentUser != null)
                _browsers[_c.CurrentUser.Key].LastWindowName = _browsers[_c.CurrentUser.Key].Driver.WrappedDriver.WindowHandles.Last();

            _c.CurrentUser = UserIsParticipant(user) ? GetDefaultParticipant() : GetMatchingDisplayName(user);

            if (_c.CurrentUser == null)
                throw new ArgumentOutOfRangeException($"There are no users configured called '{user}'");
        }

        private static bool UserIsParticipant(string user)
        {
            return user.ToLower().Equals("participant");
        }

        private UserAccount GetDefaultParticipant()
        {
            return UserManager.GetDefaultParticipantUser(_c.UserAccounts);
        }

        private UserAccount GetMatchingDisplayName(string user)
        {
            return UserManager.GetUserFromDisplayName(_c.UserAccounts, user);
        }

        [When(@"switches to the (.*) tab")]
        public void WhenSwitchesToTheNewTab(string url)
        {
            _browsers[_c.CurrentUser.Key].LastWindowName = _browsers[_c.CurrentUser.Key].SwitchTab(url);
        }

        [Then(@"the user is on the (.*) page")]
        public void ThenTheUserIsOnThePage(string page)
        {
            _browsers[_c.CurrentUser.Key].PageUrl(Page.FromString(page).Url);
        }

        [Then(@"the user is not on the (.*) page")]
        public void ThenTheUserIsNotOnThePage(string page)
        {
            _browsers[_c.CurrentUser.Key].PageUrl(page);
        }

        [When(@"the user refreshes the page")]
        public void WhenTheUserRefreshesThePage()
        {
            _browsers[_c.CurrentUser.Key].Driver.Navigate().Refresh();
        }
    }
}
