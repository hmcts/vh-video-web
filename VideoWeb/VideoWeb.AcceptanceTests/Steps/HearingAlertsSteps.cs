using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using FluentAssertions;
using TechTalk.SpecFlow;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Builders;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.AcceptanceTests.Users;
using VideoWeb.Contract.Request;
using VideoWeb.Services.Video;
using EventType = VideoWeb.EventHub.Enums.EventType;
using RoomType = VideoWeb.EventHub.Enums.RoomType;
using UserRole = VideoWeb.EventHub.Enums.UserRole;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class HearingAlertsSteps
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _tc;
        private readonly ScenarioContext _scenarioContext;
        private readonly VhoHearingListPage _hearingListPage;
        private readonly AdminPanelPage _adminPanelPage;
        private const string ParticipantKey = "participant";
        private const string AlertTimeKey = "alert time";

        public HearingAlertsSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext, ScenarioContext scenarioContext,
            VhoHearingListPage hearingListPage, AdminPanelPage adminPanelPage)
        {
            _browsers = browsers;
            _tc = testContext;
            _scenarioContext = scenarioContext;
            _hearingListPage = hearingListPage;
            _adminPanelPage = adminPanelPage;
        }

        [When(@"a participant has chosen to block user media")]
        public void WhenAParticipantHasChosenToBlockUserMedia()
        {
            var participantUser = GetUserFromConferenceDetails(UserRole.Individual.ToString());

            var request = new CallbackEventRequestBuilder()
                .WithConferenceId(_tc.NewConferenceId)
                .WithParticipantId(participantUser.Id)
                .WithEventType(EventType.MediaPermissionDenied)
                .Build();

            new ExecuteEventBuilder()
                .WithContext(_tc)
                .WithScenarioContext(_scenarioContext)
                .WithRequest(request)
                .SendToVideoApi();
        }

        [When(@"the judge has disconnected from the hearing")]
        public void WhenTheJudgeHasSuspendedTheHearing()
        {
            var request = new CallbackEventRequestBuilder()
                .WithConferenceId(_tc.NewConferenceId)
                .WithParticipantId(GetClerkParticipantId())
                .WithEventType(EventType.Disconnected)
                .WithRoomType(RoomType.HearingRoom)
                .Build();

            new ExecuteEventBuilder()
                .WithContext(_tc)
                .WithScenarioContext(_scenarioContext)
                .WithRequest(request)
                .SendToVideoWeb();
        }

        [When(@"a (.*) has disconnected from the (.*)")]
        public void WhenAParticipantHasDisconnectedFromTheHearing(string participant, RoomType room)
        {
            var participantUser = GetUserFromConferenceDetails(participant);

            var request = new CallbackEventRequestBuilder()
                .WithConferenceId(_tc.NewConferenceId)
                .WithParticipantId(participantUser.Id)
                .WithEventType(EventType.Disconnected)
                .WithRoomType(room)
                .Build();

            new ExecuteEventBuilder()
                .WithContext(_tc)
                .WithScenarioContext(_scenarioContext)
                .WithRequest(request)
                .SendToVideoWeb();
        }

        private ParticipantDetailsResponse GetUserFromConferenceDetails(string userRole)
        {
            var participantUser = userRole.ToLower().Equals("judge") || userRole.ToLower().Equals("clerk")
                ? _tc.Conference.Participants.Find(x => x.User_role.ToString().Equals(UserRole.Judge.ToString()))
                : _tc.Conference.Participants.Find(x => x.User_role.ToString().Equals(UserRole.Individual.ToString()));

            if (participantUser.Id == null)
                throw new DataMisalignedException("Participant Id is not set");

            _scenarioContext.Add(ParticipantKey, participantUser);
            return participantUser;
        }

        [When(@"a participant has failed the self-test")]
        public void WhenAParticipantHasFailedTheSelf_Test()
        {
            var request = new MediaEventBuilder()
                .ForParticipant(GetIndividualParticipantId())
                .WithReason(SelfTestFailureReason.Camera)
                .WithScenarioContext(_scenarioContext)
                .Build();

            _tc.Request = _tc.Post(new VideoWebMediaEventEndpoints().SelfTestFailureEvents(_tc.NewConferenceId),
                request);

            new ExecuteRequestBuilder()
                .WithContext(_tc)
                .WithExpectedStatusCode(HttpStatusCode.NoContent)
                .SendToVideoWeb();
        }

        [When(@"a participant has failed the self-test with (.*)")]
        public void WhenAParticipantHasFailedTheSelfTestWithReason(string reason)
        {
            var participant = GetUserFromConferenceDetails(UserRole.Individual.ToString());

            var request = new CallbackEventRequestBuilder()
                .WithConferenceId(_tc.NewConferenceId)
                .WithParticipantId(participant.Id)
                .WithEventType(EventType.SelfTestFailed)
                .WithReason(reason)
                .Build();

            new ExecuteEventBuilder()
                .WithContext(_tc)
                .WithScenarioContext(_scenarioContext)
                .WithRequest(request)
                .SendToVideoApi();

            //var mediaEvent = new MediaEventBuilder()
            //    .ForParticipant(participant.Id)
            //    .WithReason(ParseReason(reason))
            //    .WithScenarioContext(_scenarioContext)
            //    .Build();

            //_tc.Request = _tc.Post(new VideoWebMediaEventEndpoints().SelfTestFailureEvents(_tc.NewConferenceId),
            //    mediaEvent);

            //new ExecuteRequestBuilder()
            //    .WithContext(_tc)
            //    .WithExpectedStatusCode(HttpStatusCode.NoContent)
            //    .SendToVideoWeb();
        }

        private static SelfTestFailureReason ParseReason(string entireReason)
        {
            const string standardText = "Failed test-score";

            if (!entireReason.Contains("("))
                throw new InvalidCastException($"Reason does not contain the standard '{standardText}' text");

            var shortenedReason = entireReason.Substring(standardText.Length).Replace("(","").Replace(")", "").Replace(" ","").Trim();
            Enum.TryParse(shortenedReason, out SelfTestFailureReason failureReason);
            return failureReason;
        }

        [When(@"the user selects the (.*) alert")]
        public void WhenTheUserSelectsTheAlert(string alertType)
        {
            var alerts = GetAlerts();
            var alert = alerts.First(x => x.AlertType.ToLower().Contains(alertType.ToLower()));
            _browsers[_tc.CurrentUser.Key].Driver.ClickAndWaitForPageToLoad(_adminPanelPage.AlertCheckbox(alert.Row + 1));
        }

        [When(@"the hearing has been closed")]
        public void WhenTheHearingHasBeenClosed()
        {
            var request = new CallbackEventRequestBuilder()
                .WithConferenceId(_tc.NewConferenceId)
                .WithParticipantId(GetClerkParticipantId())
                .WithEventType(EventType.Close)
                .WithRoomType(RoomType.HearingRoom)
                .Build();

            new ExecuteEventBuilder()
                .WithContext(_tc)
                .WithScenarioContext(_scenarioContext)
                .WithRequest(request)
                .SendToVideoWeb();

            _scenarioContext.Remove(ParticipantKey);
            _scenarioContext.Remove(AlertTimeKey);
        }

        [Then(@"the Video Hearings Officer user should not see an alert")]
        public void ThenTheVideoHearingsOfficerUserShouldNotSeeAnAlert()
        {
            _browsers[_tc.CurrentUser.Key].Driver.Navigate().Refresh();

            _browsers[_tc.CurrentUser.Key].Driver
                .WaitUntilVisible(
                    _hearingListPage.VideoHearingsOfficerSelectHearingButton(_tc.Hearing.Cases.First().Number))
                .Click();

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementNotVisible(_adminPanelPage.AlertsHeader)
                .Should().BeTrue("Alerts box should not be visible.");
        }

        [Then(@"the Video Hearings Officer user should see a (.*) notification and a (.*) alert")]
        public void ThenTheVideoHearingsOfficerUserShouldSeeAnAlert(string notification, string alertType)
        {
            _browsers[_tc.CurrentUser.Key].Driver.Navigate().Refresh();

            _browsers[_tc.CurrentUser.Key].Driver
                .WaitUntilVisible(
                    _hearingListPage.VideoHearingsOfficerNumberofAlerts(_tc.Hearing.Cases.First().Number))
                .Text.Should().Contain("Alert");

            _browsers[_tc.CurrentUser.Key].Driver
                .WaitUntilVisible(
                    _hearingListPage.VideoHearingsOfficerAlertType(_tc.Hearing.Cases.First().Number))
                .Text.Should().Be(notification.Equals("Suspended") ? notification : "Not Started");

            _browsers[_tc.CurrentUser.Key].Driver
                .WaitUntilVisible(
                    _hearingListPage.VideoHearingsOfficerSelectHearingButton(_tc.Hearing.Cases.First().Number))
                .Click();

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_adminPanelPage.ParticipantStatusTable, 60).Displayed.Should().BeTrue();

            var alerts = GetAlerts();
            var timeOfAlert = _scenarioContext.Get<DateTime>(AlertTimeKey).ToString(DateFormats.AlertMessageTimestamp);
            var timeOfAlertMinusAMinute = _scenarioContext.Get<DateTime>(AlertTimeKey).AddMinutes(-1).ToString(DateFormats.AlertMessageTimestamp);
            var timeOfAlertPlusAMinute = _scenarioContext.Get<DateTime>(AlertTimeKey).AddMinutes(1).ToString(DateFormats.AlertMessageTimestamp);

            foreach (var alert in alerts)
            {
                alert.Checkbox.Selected.Should().BeFalse();
                alert.Checkbox.Enabled.Should().BeTrue();                
                alert.Timestamp.Should().Match<string>(t=> t.Equals(timeOfAlert) || t.Equals(timeOfAlertMinusAMinute) || t.Equals(timeOfAlertPlusAMinute));
            }

            var alertTypeExists = alerts.Any(alert => alert.AlertType.ToLower().Contains(alertType.ToLower()));
            alertTypeExists.Should().BeTrue();

            if (alertType.ToLower().Contains("failed self-test") || alertType.ToLower().Equals("disconnected"))
            {
                alerts.First(x => x.AlertType.ToLower().Contains(alertType.ToLower())).Username.Should()
                    .Be(_scenarioContext.Get<ParticipantDetailsResponse>(ParticipantKey).Name);
            }
        }

        [Then(@"the (.*) checkbox is no longer enabled")]
        public void ThenTheCheckboxIsNoLongerEnabled(string alertType)
        {
            var alerts = GetAlerts();
            var alert = alerts.First(x => x.AlertType.ToLower().Contains(alertType.ToLower()));
            alert.Checkbox.Enabled.Should().BeFalse();
        }

        [Then(@"the Video Hearings Officer should only see (.*) hearing")]
        [Then(@"the Video Hearings Officer should only see (.*) hearings")]
        public void ThenTheVideoHearingsOfficerShouldOnlySeeHearing(int count)
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementsVisible(_hearingListPage.VhoHearingRows).Count.Should().Be(count);
        }

        [Then(@"the (.*) alert should be updated with the details of the user that actioned the alert")]
        public void ThenTheAlertShouldBeUpdatedWithTheDetailsOfTheUserThatActionedTheAlert(string alertType)
        {
            var alerts = GetAlerts();
            var alert = alerts.First(x => x.AlertType.ToLower().Contains(alertType.ToLower()));
            var time = DateTime.Now.ToString(DateFormats.AlertMessageTimestamp);
            var timeMinusAMinute = DateTime.Now.AddMinutes(-1).ToString(DateFormats.AlertMessageTimestamp);
            var timePlusAMinute = DateTime.Now.AddMinutes(1).ToString(DateFormats.AlertMessageTimestamp);
            alert.ActionedAt.Should().Match<string>(t => t.Equals(time) || t.Equals(timeMinusAMinute) || t.Equals(timePlusAMinute));
            alert.ActionedBy.Should().Be(_tc.CurrentUser.Username.ToLower());
        }

        private Guid? GetClerkParticipantId()
        {
            return _tc.Conference.Participants.Find(x => x.User_role.ToString().Equals(UserRole.Judge.ToString())).Id;
        }

        private Guid? GetIndividualParticipantId()
        {
            return _tc.Conference.Participants.Find(x => x.User_role.ToString().Equals(UserRole.Individual.ToString())).Id;
        }

        private List<Alert> GetAlerts()
        {
            var rowsCount = _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementsVisible(_adminPanelPage.AlertRows).Count;
            rowsCount.Should().BeGreaterThan(0);
            var alerts = new List<Alert>();

            for (var i = 0; i < rowsCount; i++)
            {
                var alert = new Alert
                {
                    Row = i,
                    Checkbox = _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementsVisible(_adminPanelPage.AlertCheckboxes)[i],
                    Timestamp = _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementsVisible(_adminPanelPage.AlertTimestamp)[i].Text,
                    AlertType = _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementsVisible(_adminPanelPage.AlertMessage)[i].Text,
                    Username = _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementsVisible(_adminPanelPage.AlertByUser)[i].Text
                };
                if (!_browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementsVisible(_adminPanelPage.AlertCheckboxes)[i].Enabled)
                {
                    var actionedByDetails = _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_adminPanelPage.ActionedBy(alert.AlertType)).Text;
                    alert.ActionedBy = actionedByDetails.Split(" ")[0].Trim();
                    alert.ActionedAt = actionedByDetails.Split(" ")[1].Trim();
                }
                alerts.Add(alert);
            }

            return alerts;
        }
    }
}
