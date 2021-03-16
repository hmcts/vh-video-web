using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using AcceptanceTests.Common.Api.Helpers;
using AcceptanceTests.Common.Driver.Drivers;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using TestApi.Contract.Dtos;
using TestApi.Contract.Enums;
using TestApi.Contract.Requests;
using TestApi.Contract.Responses;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class BrowserSteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<UserDto, UserBrowser> _browsers;

        public BrowserSteps(TestContext context, Dictionary<UserDto, UserBrowser> browsers)
        {
            _c = context;
            _browsers = browsers;
        }

        [Given(@"a new browser is open for (?:user|the|a|an) (.*)")]
        [Given(@"(?:the|an|a) (.*) is on the login page")]
        public void GivenANewBrowserIsOpenFor(string user)
        {
            SwitchCurrentUser(user);

            _browsers.Add(_c.CurrentUser, new UserBrowser()
                .SetBaseUrl(_c.VideoWebConfig.VhServices.VideoWebUrl)
                .SetTargetDevice(_c.VideoWebConfig.TestConfig.TargetDevice)
                .SetTargetBrowser(_c.VideoWebConfig.TestConfig.TargetBrowser)
                .SetDriver(_c.Driver));

            _browsers[_c.CurrentUser].LaunchBrowser();
            _browsers[_c.CurrentUser].NavigateToPage();
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

        private UserDto GetDefaultParticipant()
        {
            if (_c.Test.Users.Count != 0) return Users.GetDefaultParticipantUser(_c.Test.Users);
            AllocateSingleUser(UserType.Individual);
            return Users.GetDefaultParticipantUser(_c.Test.Users);
        }

        private UserDto GetMatchingDisplayName(string userType)
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
                ExpiryInMinutes = 1,
                IsProdUser = _c.VideoWebConfig.IsLive,
                TestType = TestType.Automated,
                UserType = userType
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
        [Then(@"they should be on the (.*) page")]
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
