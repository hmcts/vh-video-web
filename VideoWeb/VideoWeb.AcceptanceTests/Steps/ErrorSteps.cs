using System;
using System.Diagnostics;
using System.Net;
using FluentAssertions;
using RestSharp;
using TechTalk.SpecFlow;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class ErrorSteps
    {
        private readonly BrowserContext _browserContext;
        private readonly TestContext _context;
        private readonly ErrorPage _errorPage;

        public ErrorSteps(BrowserContext browserContext, TestContext context, ErrorPage errorPage)
        {
            _browserContext = browserContext;
            _context = context;
            _errorPage = errorPage;
        }

        [When(@"the user attempts to navigate to a nonexistent page")]
        public void WhenTheUserAttemptsToNavigateToANonexistentPage()
        {
            _browserContext.NavigateToPage("non-existent-page");
        }

        [When(@"the user is removed from the hearing")]
        public void WhenTheUserIsRemovedFromTheHearing()
        {
            var participantId = _context.Conference.Participants.Find(x => x.Display_name == _context.CurrentUser.Displayname).Id;            
            var endpoint = new VideoApiUriFactory().ParticipantsEndpoints;
            Debug.Assert(_context.Conference.Id != null, "_context.Conference.Id != null");
            Debug.Assert(participantId != null, nameof(participantId) + " != null");
            _context.Request = _context.Delete(endpoint.RemoveParticipantFromConference((Guid) _context.Conference.Id, (Guid) participantId));
            _context.Response = _context.VideoApiClient().Execute(_context.Request);
            _context.Response.StatusCode.Should().Be(HttpStatusCode.NoContent);
            _context.Response.ResponseStatus.Should().Be(ResponseStatus.Completed);
            _context.Response.IsSuccessful.Should().BeTrue();
        }

        [When(@"the user tries to navigate back to the waiting room page")]
        public void WhenTheUserNtrieToNavigateBackToTheWaitingRoomPage()
        {
            _browserContext.NgDriver.Navigate().Back();
            _browserContext.NgDriver.Navigate().Forward();
        }

        [Then(@"the (.*) error page displays text of how to rectify the problem")]
        public void ThenTheErrorPageDisplaysTextOfHowToRectifyTheProblem(string page)
        {
            if (page.Equals("Not Found"))
            {
                _browserContext.NgDriver.WaitUntilElementVisible(_errorPage.NotFoundPageTitle).Displayed
                    .Should().BeTrue();

                _browserContext.NgDriver.WaitUntilElementVisible(_errorPage.TypedErrorMessage).Displayed
                    .Should().BeTrue();

                _browserContext.NgDriver.WaitUntilElementVisible(_errorPage.PastedErrorMessage).Displayed
                    .Should().BeTrue();

                _browserContext.NgDriver.WaitUntilElementVisible(_errorPage.LinkErrorMessage).Displayed
                    .Should().BeTrue();
            }

            if (!page.Equals("Unauthorised")) return;
            _browserContext.NgDriver.WaitUntilElementVisible(_errorPage.UnauthorisedPageTitle).Displayed
                .Should().BeTrue();

            _browserContext.NgDriver.WaitUntilElementVisible(_errorPage.NotRegisteredErrorMessage).Displayed
                .Should().BeTrue();

            _browserContext.NgDriver.WaitUntilElementVisible(_errorPage.IsThisAMistakeErrorMessage).Displayed
                .Should().BeTrue();
        }
    }
}
