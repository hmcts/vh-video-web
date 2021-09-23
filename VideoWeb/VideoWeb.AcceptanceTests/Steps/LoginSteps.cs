using System.Collections.Generic;
using System.Linq;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Enums;
using AcceptanceTests.Common.PageObject.Pages;
using AcceptanceTests.Common.Test.Steps;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using TestApi.Contract.Dtos;
using VideoWeb.AcceptanceTests.Pages;
using TestApi.Contract.Enums;
using BookingsApi.Contract.Configuration;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class LoginSteps : ISteps
    {
        private const int ReachedThePageRetries = 2;
        private LoginSharedSteps _loginSharedSteps;
        private readonly Dictionary<UserDto, UserBrowser> _browsers;
        private readonly TestContext _c;
        private readonly bool isEjudEnabled;

        public LoginSteps(Dictionary<UserDto, UserBrowser> browsers, TestContext c)
        {
            _browsers = browsers;
            _c = c;
            isEjudEnabled = bool.Parse(c.Apis.BookingsApi.GetFeatureFlagByName(nameof(FeatureFlags.EJudFeature)).Content);
        }

        [When(@"they attempt to login with valid credentials")]
        public void ProgressToNextPage()
        {
            if (_c.VideoWebConfig.TestConfig.TargetBrowser == TargetBrowser.Ie11) return;
            if (isEjudEnabled)
            {
                SelectUserType();
            }
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
            if (isEjudEnabled)
            {
                _browsers[_c.CurrentUser].PageUrl(Page.IdpSelection.Url);
            }
            else
            {
                _browsers[_c.CurrentUser].PageUrl(Page.Login.Url);

            }
        }

        [Then(@"the sign out link is displayed")]
        public void ThenTheSignOutLinkIsDisplayed()
        {
            _loginSharedSteps.ThenTheSignOutLinkIsDisplayed();
        }

        private bool IsAnEjudUser()
        {
            var isEjud = _c.VideoWebConfig.ValidEjudDIdDomains.Any(_c.CurrentUser.ContactEmail.Contains);
            NUnit.Framework.TestContext.WriteLine($"Check for Ejud user: {_c.CurrentUser.DisplayName} is {_c.CurrentUser.GetType()} ID: {_c.CurrentUser.Id} User name: {_c.CurrentUser.Username} user type: {_c.CurrentUser.UserType} Email: {_c.CurrentUser.ContactEmail} and ejud is {isEjudEnabled}");
            return _c.VideoWebConfig.UsingEjud
                && isEjud
                && isEjudEnabled
                && IsUserRoleJudiciary(_c.CurrentUser.UserType);
        }

        private bool IsUserRoleJudiciary(UserType userType)
        {
            return (userType == UserType.Judge ||
                    userType == UserType.PanelMember ||
                    userType == UserType.Winger);
        }
    }
}
