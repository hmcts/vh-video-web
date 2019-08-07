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
using VideoWeb.AcceptanceTests.Users;
using VideoWeb.Common.Helpers;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class HearingsStatusSteps
    {
        private const int MaxRetries = 10;
        private readonly TestContext _tc;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly VhoHearingListPage _hearingListPage;

        public HearingsStatusSteps(Dictionary<string, UserBrowser> browsers, TestContext tc, VhoHearingListPage hearingListPage)
        {
            _tc = tc;
            _browsers = browsers;
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
            actions[status].Execute(_tc, GetJudgeParticipantId());
        }

        [Then(@"the hearings should be in chronological order")]
        public void ThenTheHearingsShouldBeInChronologicalOrder()
        {
            var displayedCaseOrder = _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementsVisible(_hearingListPage.VideoHearingsCaseNumbers);
            displayedCaseOrder.First().Text.Should().Be(_tc.Hearing.Cases.First().Number);
        }

        [Then(@"the Video Hearings Officer user should see a (.*) notification")]
        public void ThenTheVideoHearingsOfficerUserShouldSeeANotification(string notification)
        {
            _browsers[_tc.CurrentUser.Key].Driver
                .WaitUntilElementVisible(
                    _hearingListPage.VideoHearingsOfficerAlertType(_tc.Hearing.Cases.First().Number))
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
            if (_tc.Conference.Id == null)
            {
                throw new DataMisalignedException("Conference Id is not set");
            }
            var endpoint =
                new VideoApiUriFactory().ConferenceEndpoints
                    .GetConferenceDetailsById((Guid)_tc.Conference.Id);
            _tc.Request = _tc.Get(endpoint);
            _tc.Response = _tc.VideoApiClient().Execute(_tc.Request);
            _tc.Response.StatusCode.Should().Be(HttpStatusCode.OK);
            return ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<ConferenceDetailsResponse>(_tc.Json);
        }

        private string GetJudgeParticipantId()
        {
            return _tc.Conference.Participants.Find(x => x.User_role.Equals(UserRole.Judge)).Id.ToString();
        }
    }
}
