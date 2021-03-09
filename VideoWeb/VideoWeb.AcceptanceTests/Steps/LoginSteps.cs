using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Enums;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.PageObject.Pages;
using AcceptanceTests.Common.Test.Steps;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using TestApi.Contract.Dtos;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class LoginSteps : ISteps
    {
        private const int ReachedThePageRetries = 2;
        private LoginSharedSteps _loginSharedSteps;
        private readonly Dictionary<UserDto, UserBrowser> _browsers;
        private readonly TestContext _c;

        public LoginSteps(Dictionary<UserDto, UserBrowser> browsers, TestContext c)
        {
            _browsers = browsers;
            _c = c;
        }

        [When(@"they attempt to login with valid credentials")]
        public void ProgressToNextPage()
        {
            if (_c.VideoWebConfig.TestConfig.TargetBrowser == TargetBrowser.Ie11) return;
            _loginSharedSteps = new LoginSharedSteps(_browsers[_c.CurrentUser], _c.CurrentUser.Username, _c.VideoWebConfig.TestConfig.TestUserPassword);
            _loginSharedSteps.ProgressToNextPage();
        }
        
        [Then(@"they should have the option to log back in when they logout")]
        public void WhenTheUserAttemptsToLogout()
        {
            _browsers[_c.CurrentUser].ClickLink(CommonPages.SignOutLink);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(CommonPages.SignOutMessage).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].ClickLink(CommonPages.SignInLink);
            _browsers[_c.CurrentUser].Retry(() => _browsers[_c.CurrentUser].Driver.Title.Trim().Should().Be(LoginPage.SignInTitle), ReachedThePageRetries);
        }

        [Then(@"the sign out link is displayed")]
        public void ThenTheSignOutLinkIsDisplayed()
        {
            _loginSharedSteps.ThenTheSignOutLinkIsDisplayed();
        }
    }
}
