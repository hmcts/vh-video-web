using System.Collections.Generic;
using System.Linq;
using System.Net;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using RestSharp;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using TestApi.Client;
using TestApi.Contract.Dtos;
using TestApi.Contract.Enums;
using TestApi.Contract.Dtos;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class ErrorSteps
    {
        private readonly Dictionary<UserDto, UserBrowser> _browsers;
        private readonly TestContext _c;
        private readonly LoginSteps _loginSteps;

        public ErrorSteps(Dictionary<UserDto, UserBrowser> browsers, TestContext testContext, LoginSteps loginSteps)
        {
            _browsers = browsers;
            _c = testContext;
            _loginSteps = loginSteps;
        }

        [When(@"the user attempts to navigate to a nonexistent page")]
        public void WhenTheUserAttemptsToNavigateToANonexistentPage()
        {
            _browsers[_c.CurrentUser].NavigateToPage(AddSlashToUrlIfRequired());
        }

        private string AddSlashToUrlIfRequired()
        {
            var baseUrl = _c.VideoWebConfig.VhServices.VideoWebUrl;
            var url = baseUrl[^1].Equals(char.Parse("/")) ? "non-existent-page" : "/non-existent-page";
            return url;
        }

        [When(@"the user is removed from the hearing")]
        public void WhenTheUserIsRemovedFromTheHearing()
        {
            var participantId = _c.Test.ConferenceParticipants.First(x => x.DisplayName == _c.CurrentUser.DisplayName).Id;
            var response = _c.Apis.TestApi.RemoveParticipantFromConference(_c.Test.NewConferenceId, participantId);
            response.StatusCode.Should().Be(HttpStatusCode.NoContent);
            response.ResponseStatus.Should().Be(ResponseStatus.Completed);
        }

        [When(@"the user tries to navigate back to the waiting room page")]
        public void WhenTheUserTriesToNavigateBackToTheWaitingRoomPage()
        {
            _browsers[_c.CurrentUser].Driver.Navigate().Back();
            _browsers[_c.CurrentUser].Driver.Navigate().Forward();
        }

        [When(@"the user attempts to access the page on their unsupported browser")]
        [When(@"the user attempts to access the page on their unsupported device")]
        public void WhenTheUserAttemptsToAccessThePageOnTheirUnsupportedBrowser()
        {
            _loginSteps.ProgressToNextPage();
        }

        [Then(@"the Not Found error page displays text of how to rectify the problem")]
        public void ThenTheNotFoundErrorPageDisplaysTextOfHowToRectifyTheProblem()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(ErrorPage.NotFoundPageTitle).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(ErrorPage.TypedErrorMessage).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(ErrorPage.PastedErrorMessage).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(ErrorPage.LinkErrorMessage).Displayed.Should().BeTrue();
        }

        [Then(@"the Unauthorised error page displays text of how to rectify the problem")]
        public void ThenTheUnauthorisedErrorPageDisplaysTextOfHowToRectifyTheProblem()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(ErrorPage.UnauthorisedPageTitle).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(ErrorPage.NotRegisteredErrorMessage).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(ErrorPage.IsThisAMistakeErrorMessage).Displayed.Should().BeTrue();
        }

        [Then(@"the user is on the Unsupported Browser error page with text of how to rectify the problem")]
        public void ThenTheUnsupportedBrowserErrorPageDisplaysTextOfHowToRectifyTheProblem()
        {
            _browsers[_c.CurrentUser].PageUrl(Page.UnsupportedBrowser.Url);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(ErrorPage.UnsupportedBrowserTitle).Displayed.Should().BeTrue();
        }

        [Then(@"the user is on the Unsupported Device error page with text of how to rectify the problem")]
        public void ThenTheUserIsOnTheUnsupportedDeviceErrorPageWithTextOfHowToRectifyTheProblem()
        {
            _browsers[_c.CurrentUser].PageUrl(Page.UnsupportedDevice.Url);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(ErrorPage.UnsupportedDeviceTitle).Displayed.Should().BeTrue();
        }
    }
}
