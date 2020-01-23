using System;
using System.Collections.Generic;
using System.Net;
using AcceptanceTests.Common.Api.Uris;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Driver.Support;
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
            var participantId = _c.Conference.Participants.Find(x => x.Display_name == _c.CurrentUser.DisplayName).Id;            
            var endpoint = new VideoApiUriFactory().ParticipantsEndpoints;
            _c.Request = _c.Delete(endpoint.RemoveParticipantFromConference( _c.Conference.Id, participantId));
            _c.Response = _c.VideoApiClient().Execute(_c.Request);
            _c.Response.StatusCode.Should().Be(HttpStatusCode.NoContent);
            _c.Response.ResponseStatus.Should().Be(ResponseStatus.Completed);
            _c.Response.IsSuccessful.Should().BeTrue();
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
            if (_c.VideoWebConfig.TestConfig.TargetBrowser == TargetBrowser.Edge)
            {
                _loginSteps.ProgressToNextPage();
            }
        }

        [Then(@"the Not Found error page displays text of how to rectify the problem")]
        public void ThenTheNotFoundErrorPageDisplaysTextOfHowToRectifyTheProblem()
        {
            _browsers[_c.CurrentUser.Key]
                .Driver.WaitUntilVisible(ErrorPage.NotFoundPageTitle)
                .Displayed.Should().BeTrue();

            _browsers[_c.CurrentUser.Key]
                .Driver.WaitUntilVisible(ErrorPage.TypedErrorMessage)
                .Displayed.Should().BeTrue();

            _browsers[_c.CurrentUser.Key]
                .Driver.WaitUntilVisible(ErrorPage.PastedErrorMessage)
                .Displayed.Should().BeTrue();

            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ErrorPage.LinkErrorMessage)
                .Displayed.Should().BeTrue();
        }

        [Then(@"the Unauthorised error page displays text of how to rectify the problem")]
        public void ThenTheUnauthorisedErrorPageDisplaysTextOfHowToRectifyTheProblem()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ErrorPage.UnauthorisedPageTitle)
                .Displayed.Should().BeTrue();

            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ErrorPage.NotRegisteredErrorMessage)
                .Displayed.Should().BeTrue();

            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ErrorPage.IsThisAMistakeErrorMessage)
                .Displayed.Should().BeTrue();
        }

        [Then(@"the user is on the Unsupported Browser error page with text of how to rectify the problem")]
        public void ThenTheUnsupportedBrowserErrorPageDisplaysTextOfHowToRectifyTheProblem()
        {
            if (_c.VideoWebConfig.TestConfig.TargetBrowser == TargetBrowser.Edge)
            {
                _browsers[_c.CurrentUser.Key].PageUrl(Page.UnsupportedBrowser.Url);
            }
            else
            {
                _browsers[_c.CurrentUser.Key].Driver.Url.Should().NotContain(Page.HearingList.Url);
            }

            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ErrorPage.UnsupportedBrowserTitle)
                .Displayed.Should().BeTrue();
        }
    }
}
