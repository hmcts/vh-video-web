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
using VideoWeb.AcceptanceTests.Pages;
using TestApi.Contract.Enums;

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
            SelectUserType();
            _loginSharedSteps = new LoginSharedSteps(_browsers[_c.CurrentUser], _c.CurrentUser.Username, _c.VideoWebConfig.TestConfig.TestUserPassword);
            _loginSharedSteps.ProgressToNextPage();
            if (IsAnEjudUser())
            {
                _browsers[_c.CurrentUser].ClickRadioButton(AccountTypeSelectionPage.DoNotStayLoggedInButton);
            }
        }

        private void SelectUserType()
        {
            _browsers[_c.CurrentUser].ClickRadioButton(IsAnEjudUser()
                ? AccountTypeSelectionPage.JohUserRadioButton
                : AccountTypeSelectionPage.HearingParticipantRadioButton);
            _browsers[_c.CurrentUser].Click(AccountTypeSelectionPage.NextButton);
        }

        [Then(@"they should have the option to log back in when they logout")]
        public void ThenTheyShouldHaveOptionToLogBackInAfterLogout()
        {
            _browsers[_c.CurrentUser].ClickLink(CommonPages.SignOutLink);
            _browsers[_c.CurrentUser].Click(LogoutPage.ChooseWhoToSignOut(_c.CurrentUser.DisplayName));
            _browsers[_c.CurrentUser].ClickLink(CommonPages.SignInLink);
            _browsers[_c.CurrentUser].PageUrl(Page.IdpSelection.Url);
        }

        [Then(@"the sign out link is displayed")]
        public void ThenTheSignOutLinkIsDisplayed()
        {
            _loginSharedSteps.ThenTheSignOutLinkIsDisplayed();
        }

        private bool IsAnEjudUser()
        {
            return _c.VideoWebConfig.UsingEjud &&
                    //_c.CurrentUser.ContactEmail.Contains("judiciarystaging") &&      -- Just tried this to see tests are passing. It is passing, but Need amendment to make it a proper implementation. 
                    (_c.CurrentUser.UserType == UserType.Judge ||
                    _c.CurrentUser.UserType == UserType.PanelMember ||
                    _c.CurrentUser.UserType == UserType.Winger);
        }
    }
}
