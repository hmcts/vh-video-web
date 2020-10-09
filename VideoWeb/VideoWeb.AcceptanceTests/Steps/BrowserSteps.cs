using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using AcceptanceTests.Common.Api.Helpers;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Enums;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.Services.TestApi;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class BrowserSteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<User, UserBrowser> _browsers;

        public BrowserSteps(TestContext testContext, Dictionary<User, UserBrowser> browsers)
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

            var browser = new UserBrowser()
                .SetBaseUrl(_c.VideoWebConfig.VhServices.VideoWebUrl)
                .SetTargetDevice(_c.VideoWebConfig.TestConfig.TargetDevice)
                .SetTargetBrowser(_c.VideoWebConfig.TestConfig.TargetBrowser)
                .SetDriver(_c.Driver);

            _browsers.Add(_c.CurrentUser, browser);

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
            SwitchCurrentUser(user);

            _browsers[_c.CurrentUser].Driver.SwitchTo().Window(_browsers[_c.CurrentUser].LastWindowName);
        }

        private void SwitchCurrentUser(string user)
        {
            if (_c.CurrentUser != null)
                _browsers[_c.CurrentUser].LastWindowName = _browsers[_c.CurrentUser].Driver.WrappedDriver.WindowHandles.Last();

            user = RemoveErroneousText(user);

            if (user.Contains("first") || user.Contains("second") || user.Contains("third") || user.Contains("fourth") || user.Contains("fifth"))
            {
                var number = user.Split(" ")[0].Trim();
                _c.CurrentUser = Users.GetUser(_c.Test.Users, number, user);
            }
            else
            {
                _c.CurrentUser = UserIsParticipant(user) ? GetDefaultParticipant() : GetMatchingDisplayName(user);
            }

            if (_c.CurrentUser == null)
                throw new ArgumentOutOfRangeException($"There are no users configured called '{user}'");
        }

        private static string RemoveErroneousText(string text)
        {
            text = text.ToLower();
            text = text.Replace("the", string.Empty);
            text = text.Replace("self test", string.Empty);
            return text.Trim();
        }

        private static bool UserIsParticipant(string user)
        {
            return user.Equals("participant");
        }

        private User GetDefaultParticipant()
        {
            if (_c.Test.Users.Count != 0) return Users.GetDefaultParticipantUser(_c.Test.Users);
            AllocateSingleUser(UserType.Individual);
            return Users.GetDefaultParticipantUser(_c.Test.Users);
        }

        private User GetMatchingDisplayName(string userType)
        {
            if (_c.Test.Users.Count != 0)
                return Users.GetUserFromDisplayName(_c.Test.Users, userType.Replace(" ", string.Empty));
            if (!Enum.TryParse(RemoveWhiteSpace(userType), true, out UserType result))
                throw new DataMisalignedException($"User Type {userType} could not be parsed");
            AllocateSingleUser(result);
            return _c.Test.Users.First();
        }

        private static string RemoveWhiteSpace(string text)
        {
            return text.Replace(" ", string.Empty);
        }

        private void AllocateSingleUser(UserType userType)
        {
            var request = new AllocateUserRequest()
            {
                Application = Application.VideoWeb,
                Expiry_in_minutes = 1,
                Is_prod_user = _c.VideoWebConfig.IsLive,
                Test_type = TestType.Automated,
                User_type = userType
            };

            var response = _c.Apis.TestApi.AllocateUser(request);
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            response.Should().NotBeNull();
            var user = RequestHelper.Deserialise<UserDetailsResponse>(response.Content);
            user.Should().NotBeNull();
            _c.Test.Users = UserDetailsResponseToUsersMapper.Map(user);
        }

        [When(@"switches to the (.*) tab")]
        public void WhenSwitchesToTheNewTab(string url)
        {
            _browsers[_c.CurrentUser].LastWindowName = _browsers[_c.CurrentUser].SwitchTab(url);
        }

        [Then(@"the user is on the (.*) page")]
        public void ThenTheUserIsOnThePage(string page)
        {
            _browsers[_c.CurrentUser].PageUrl(Page.FromString(page).Url);
        }

        [Then(@"the user is not on the (.*) page")]
        public void ThenTheUserIsNotOnThePage(string page)
        {
            _browsers[_c.CurrentUser].PageUrl(page, true);
        }

        [When(@"the user refreshes the page")]
        public void WhenTheUserRefreshesThePage()
        {
            _browsers[_c.CurrentUser].Refresh();
        }
    }
}
