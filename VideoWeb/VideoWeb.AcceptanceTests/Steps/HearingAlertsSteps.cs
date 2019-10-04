using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using TechTalk.SpecFlow;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Builders;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.AcceptanceTests.Users;
using VideoWeb.Services.Video;

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

            var request = new EventRequestBuilder()
                .WithConferenceId(_tc.NewConferenceId)
                .WithParticipantId(participantUser.Id.ToString())
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
            var request = new EventRequestBuilder()
                .WithConferenceId(_tc.NewConferenceId)
                .WithParticipantId(GetClerkParticipantId())
                .WithEventType(EventType.Disconnected)
                .WithRoomType(RoomType.HearingRoom)
                .Build();

            new ExecuteEventBuilder()
                .WithContext(_tc)
                .WithScenarioContext(_scenarioContext)
                .WithRequest(request)
                .SendToVideoApi();
        }

        [When(@"a (.*) has disconnected from the (.*)")]
        public void WhenAParticipantHasDisconnectedFromTheHearing(string participant, RoomType room)
        {
            var participantUser = GetUserFromConferenceDetails(participant);

            var request = new EventRequestBuilder()
                .WithConferenceId(_tc.NewConferenceId)
                .WithParticipantId(participantUser.Id.ToString())
                .WithEventType(EventType.Disconnected)
                .WithRoomType(room)
                .Build();

            new ExecuteEventBuilder()
                .WithContext(_tc)
                .WithScenarioContext(_scenarioContext)
                .WithRequest(request)
                .SendToVideoApi();
        }

        private ParticipantDetailsResponse GetUserFromConferenceDetails(string userRole)
        {
            var participantUser = userRole.ToLower().Equals("judge") || userRole.ToLower().Equals("clerk")
                ? _tc.Conference.Participants.Find(x => x.User_role.Equals(UserRole.Judge))
                : _tc.Conference.Participants.Find(x => x.User_role.Equals(UserRole.Individual));

            if (participantUser.Id == null)
                throw new DataMisalignedException("Participant Id is not set");

            _scenarioContext.Add(ParticipantKey, participantUser);
            return participantUser;
        }

        [When(@"a participant has failed the self-test")]
        public void WhenAParticipantHasFailedTheSelf_Test()
        {
            var request = new EventRequestBuilder()
                .WithConferenceId(_tc.NewConferenceId)
                .WithParticipantId(GetIndividualParticipantId())
                .WithEventType(EventType.SelfTestFailed)
                .Build();

            new ExecuteEventBuilder()
                .WithContext(_tc)
                .WithScenarioContext(_scenarioContext)
                .WithRequest(request)
                .SendToVideoApi();
        }

        [When(@"a participant has failed the self-test with (.*)")]
        public void WhenAParticipantHasFailedTheSelfTestWithReason(string reason)
        {
            var request = new EventRequestBuilder()
                .WithConferenceId(_tc.NewConferenceId)
                .WithParticipantId(GetIndividualParticipantId())
                .WithEventType(EventType.SelfTestFailed)
                .WithReason(reason)
                .Build();

            new ExecuteEventBuilder()
                .WithContext(_tc)
                .WithScenarioContext(_scenarioContext)
                .WithRequest(request)
                .SendToVideoApi();
        }

        [When(@"the user selects the (.*) alert")]
        public void WhenTheUserSelectsTheAlert(string alertType)
        {
            var alerts = GetAlerts();
            var alert = alerts.First(x => x.AlertType.ToLower().Equals(alertType.ToLower()));
            _browsers[_tc.CurrentUser.Key].Driver.ClickAndWaitForPageToLoad(_adminPanelPage.AlertCheckbox(alert.Row + 1));
        }

        [When(@"the hearing has been closed")]
        public void WhenTheHearingHasBeenClosed()
        {
            var request = new EventRequestBuilder()
                .WithConferenceId(_tc.NewConferenceId)
                .WithParticipantId(GetClerkParticipantId())
                .WithEventType(EventType.Close)
                .WithRoomType(RoomType.HearingRoom)
                .Build();

            new ExecuteEventBuilder()
                .WithContext(_tc)
                .WithScenarioContext(_scenarioContext)
                .WithRequest(request)
                .SendToVideoApi();

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

            var alertTypeExists = false;
            foreach (var alert in alerts)
            {
                if (!alert.AlertType.ToLower().Equals(alertType.ToLower())) continue;
                alertTypeExists = true;
                break;
            }
            alertTypeExists.Should().BeTrue();

            if (alertType.ToLower().Equals("media blocked") || alertType.ToLower().Equals("disconnected"))
            {
                alerts.First(x => x.AlertType.ToLower().Equals(alertType.ToLower())).Username.Should()
                    .Be(_scenarioContext.Get<ParticipantDetailsResponse>(ParticipantKey).Name);
            }
        }

        [Then(@"the (.*) checkbox is no longer enabled")]
        public void ThenTheCheckboxIsNoLongerEnabled(string alertType)
        {
            var alerts = GetAlerts();
            var alert = alerts.First(x => x.AlertType.ToLower().Equals(alertType.ToLower()));
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
            var alert = alerts.First(x => x.AlertType.ToLower().Equals(alertType.ToLower()));
            var time = DateTime.Now.ToString(DateFormats.AlertMessageTimestamp);
            var timeMinusAMinute = DateTime.Now.AddMinutes(-1).ToString(DateFormats.AlertMessageTimestamp);
            var timePlusAMinute = DateTime.Now.AddMinutes(1).ToString(DateFormats.AlertMessageTimestamp);
            alert.ActionedAt.Should().Match<string>(t => t.Equals(time) || t.Equals(timeMinusAMinute) || t.Equals(timePlusAMinute));
            alert.ActionedBy.Should().Be(_tc.CurrentUser.Username.ToLower());
        }

        private string GetClerkParticipantId()
        {
            return _tc.Conference.Participants.Find(x => x.User_role.Equals(UserRole.Judge)).Id.ToString();
        }

        private string GetIndividualParticipantId()
        {
            return _tc.Conference.Participants.Find(x => x.User_role.Equals(UserRole.Individual)).Id.ToString();
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
