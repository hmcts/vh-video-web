using System.Collections.Generic;
using System.Net;
using AcceptanceTests.Common.Api.Hearings;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using RestSharp;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class ErrorSteps
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _c;
        private readonly LoginSteps _loginSteps;

        public ErrorSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext, LoginSteps loginSteps)
        {
            _browsers = browsers;
            _c = testContext;
            _loginSteps = loginSteps;
        }

        [When(@"the user attempts to navigate to a nonexistent page")]
        public void WhenTheUserAttemptsToNavigateToANonexistentPage()
        {
            _browsers[_c.CurrentUser.Key].NavigateToPage(AddSlashToUrlIfRequired());
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
            var participantId = _c.Test.ConferenceParticipants.Find(x => x.Display_name == _c.CurrentUser.DisplayName).Id;
            var videoApiManager = new VideoApiManager(_c.VideoWebConfig.VhServices.VideoApiUrl, _c.Tokens.VideoApiBearerToken);
            var response = videoApiManager.RemoveParticipantFromConference(_c.Test.NewConferenceId, participantId);
            response.StatusCode.Should().Be(HttpStatusCode.NoContent);
            response.ResponseStatus.Should().Be(ResponseStatus.Completed);
        }

        [When(@"the user tries to navigate back to the waiting room page")]
        public void WhenTheUserTriesToNavigateBackToTheWaitingRoomPage()
        {
            _browsers[_c.CurrentUser.Key].Driver.Navigate().Back();
            _browsers[_c.CurrentUser.Key].Driver.Navigate().Forward();
        }

        [When(@"the user attempts to access the page on their unsupported browser")]
        public void WhenTheUserAttemptsToAccessThePageOnTheirUnsupportedBrowser()
        {
            _loginSteps.ProgressToNextPage();
        }

        [Then(@"the Not Found error page displays text of how to rectify the problem")]
        public void ThenTheNotFoundErrorPageDisplaysTextOfHowToRectifyTheProblem()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ErrorPage.NotFoundPageTitle).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ErrorPage.TypedErrorMessage).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ErrorPage.PastedErrorMessage).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ErrorPage.LinkErrorMessage).Displayed.Should().BeTrue();
        }

        [Then(@"the Unauthorised error page displays text of how to rectify the problem")]
        public void ThenTheUnauthorisedErrorPageDisplaysTextOfHowToRectifyTheProblem()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ErrorPage.UnauthorisedPageTitle).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ErrorPage.NotRegisteredErrorMessage).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ErrorPage.IsThisAMistakeErrorMessage).Displayed.Should().BeTrue();
        }

        [Then(@"the user is on the Unsupported Browser error page with text of how to rectify the problem")]
        public void ThenTheUnsupportedBrowserErrorPageDisplaysTextOfHowToRectifyTheProblem()
        {
            _browsers[_c.CurrentUser.Key].PageUrl(Page.UnsupportedBrowser.Url);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ErrorPage.UnsupportedBrowserTitle).Displayed.Should().BeTrue();
        }
    }
}
