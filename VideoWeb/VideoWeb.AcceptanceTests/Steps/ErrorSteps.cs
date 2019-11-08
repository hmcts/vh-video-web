using System;
using System.Collections.Generic;
using System.Net;
using FluentAssertions;
using RestSharp;
using TechTalk.SpecFlow;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.AcceptanceTests.Users;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class ErrorSteps
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _tc;
        private readonly ErrorPage _errorPage;
        private readonly CommonPages _commonPages;

        public ErrorSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext, ErrorPage errorPage, CommonPages commonPages)
        {
            _browsers = browsers;
            _tc = testContext;
            _errorPage = errorPage;
            _commonPages = commonPages;
        }

        [When(@"the user attempts to navigate to a nonexistent page")]
        public void WhenTheUserAttemptsToNavigateToANonexistentPage()
        {
            _browsers[_tc.CurrentUser.Key].NavigateToPage(AddSlashToUrlIfRequired());
        }

        private string AddSlashToUrlIfRequired()
        {
            var baseUrl = _tc.VideoWebUrl;
            var url = baseUrl[baseUrl.Length - 1].Equals(char.Parse("/")) ? "non-existent-page" : "/non-existent-page";
            return url;
        }

        [When(@"the user is removed from the hearing")]
        public void WhenTheUserIsRemovedFromTheHearing()
        {
            var participantId = _tc.Conference.Participants.Find(x => x.Display_name == _tc.CurrentUser.Displayname).Id;            
            var endpoint = new VideoApiUriFactory().ParticipantsEndpoints;

            if (_tc.Conference.Id == null || participantId == null)
                throw new DataMisalignedException("Values cannot be null");

            _tc.Request = _tc.Delete(endpoint.RemoveParticipantFromConference((Guid) _tc.Conference.Id, (Guid) participantId));
            _tc.Response = _tc.VideoApiClient().Execute(_tc.Request);
            _tc.Response.StatusCode.Should().Be(HttpStatusCode.NoContent);
            _tc.Response.ResponseStatus.Should().Be(ResponseStatus.Completed);
            _tc.Response.IsSuccessful.Should().BeTrue();
        }

        [When(@"the user tries to navigate back to the waiting room page")]
        public void WhenTheUserNtrieToNavigateBackToTheWaitingRoomPage()
        {
            _browsers[_tc.CurrentUser.Key].Driver.Navigate().Back();
            _browsers[_tc.CurrentUser.Key].Driver.Navigate().Forward();
        }

        [Then(@"the Not Found error page displays text of how to rectify the problem")]
        public void ThenTheNotFoundErrorPageDisplaysTextOfHowToRectifyTheProblem()
        {
            _browsers[_tc.CurrentUser.Key]
                .Driver.WaitUntilVisible(_errorPage.NotFoundPageTitle)
                .Displayed.Should().BeTrue();

            _browsers[_tc.CurrentUser.Key]
                .Driver.WaitUntilVisible(_errorPage.TypedErrorMessage)
                .Displayed.Should().BeTrue();

            _browsers[_tc.CurrentUser.Key]
                .Driver.WaitUntilVisible(_errorPage.PastedErrorMessage)
                .Displayed.Should().BeTrue();

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_errorPage.LinkErrorMessage)
                .Displayed.Should().BeTrue();
        }

        [Then(@"the Unauthorised error page displays text of how to rectify the problem")]
        public void ThenTheUnauthorisedErrorPageDisplaysTextOfHowToRectifyTheProblem()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_errorPage.UnauthorisedPageTitle)
                .Displayed.Should().BeTrue();

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_errorPage.NotRegisteredErrorMessage)
                .Displayed.Should().BeTrue();

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_errorPage.IsThisAMistakeErrorMessage)
                .Displayed.Should().BeTrue();
        }

        [Then(@"the user is on the Unsupported Browser error page with text of how to rectify the problem")]
        public void ThenTheUnsupportedBrowserErrorPageDisplaysTextOfHowToRectifyTheProblem()
        {
            if (_tc.TargetBrowser == TargetBrowser.Edge)
                _commonPages.PageUrl(Page.UnsupportedBrowser.Url);

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_errorPage.UnsupportedBrowserTitle)
                    .Displayed.Should().BeTrue();
        }
    }
}
