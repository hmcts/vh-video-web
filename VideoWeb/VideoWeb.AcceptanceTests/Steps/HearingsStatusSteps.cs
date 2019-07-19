using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using FluentAssertions;
using TechTalk.SpecFlow;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Actions;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.Common.Helpers;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class HearingsStatusSteps
    {
        private const int MaxRetries = 5;
        private readonly TestContext _context;
        private readonly BrowserContext _browser;
        private readonly VhoHearingListPage _hearingListPage;

        public HearingsStatusSteps(TestContext context, BrowserContext browser, VhoHearingListPage hearingListPage)
        {
            _context = context;
            _browser = browser;
            _hearingListPage = hearingListPage;
        }

        [Given(@"the hearing status changes to (.*)")]
        [When(@"the hearing status changes to (.*)")]
        public void WhenTheHearingStatusChangesTooNotStarted(string status)
        {
            var actions = new Dictionary<string, IHearingStatusActions>
            {
                {"Not Started", new NotStartedAction()},
                {"Delayed", new DelayedAction()},
                {"In Session", new InSessionAction()},
                {"Paused", new PausedAction()},
                {"Suspended", new SuspendedAction()},
                {"Closed", new ClosedAction()}
            };
            actions[status].Execute(_context, GetJudgeParticipantId());
        }

        [Then(@"the hearings should be in chronological order")]
        public void ThenTheHearingsShouldBeInChronologicalOrder()
        {
            var displayedCaseOrder = _browser.NgDriver.WaitUntilElementsVisible(_hearingListPage.VideoHearingsCaseNumbers);
            displayedCaseOrder.First().Text.Should().Be(_context.Hearing.Cases.First().Number);
        }

        [Then(@"the Video Hearings Officer user should see a (.*) notification")]
        public void ThenTheVideoHearingsOfficerUserShouldSeeANotification(string notification)
        {
            _browser.NgDriver
                .WaitUntilElementVisible(
                    _hearingListPage.VideoHearingsOfficerAlertType(_context.Hearing.Cases.First().Number))
                .Text.Should().Be(notification);
        }

        [Then(@"the closedDate attribute should be populated")]
        public void WhenTheClosedDateAttributeShouldBePopulated()
        {
            var conference = GetConferenceDetails();
            conference.Closed_date_time?.Date.Should().Be(DateTime.Now.Date);
        }

        [Then(@"the hearing status changed to (.*)")]
        public void ThenTheHearingStatusChangesToPaused(ConferenceState state)
        {
            var isUpdatedState = false;
            for (var i = 0; i < MaxRetries; i++)
            {
                var conference = GetConferenceDetails();
                if (conference.Current_status.Equals(state))
                {
                    isUpdatedState = true;
                    break;
                }
                Thread.Sleep(TimeSpan.FromSeconds(1));
            }

            isUpdatedState.Should().BeTrue();
        }

        private ConferenceDetailsResponse GetConferenceDetails()
        {
            if (_context.Conference.Id == null)
            {
                throw new DataMisalignedException("Conference Id is not set");
            }
            var endpoint =
                new VideoApiUriFactory().ConferenceEndpoints
                    .GetConferenceDetailsById((Guid)_context.Conference.Id);
            _context.Request = _context.Get(endpoint);
            _context.Response = _context.VideoApiClient().Execute(_context.Request);
            _context.Response.StatusCode.Should().Be(HttpStatusCode.OK);
            return ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<ConferenceDetailsResponse>(_context.Json);
        }

        private string GetJudgeParticipantId()
        {
            return _context.Conference.Participants.Find(x => x.User_role.Equals(UserRole.Judge)).Id.ToString();
        }
    }
}
