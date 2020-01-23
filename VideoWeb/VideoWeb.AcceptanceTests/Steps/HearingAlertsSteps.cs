using System;
using System.Collections.Generic;
using System.Linq;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Builders;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
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
        private readonly TestContext _c;
        private readonly ScenarioContext _scenarioContext;
        private const string ParticipantKey = "participant";
        private const string AlertTimeKey = "alert time";

        public HearingAlertsSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext, ScenarioContext scenarioContext)
        {
            _browsers = browsers;
            _c = testContext;
            _scenarioContext = scenarioContext;
        }

        [When(@"a participant has chosen to block user media")]
        public void WhenAParticipantHasChosenToBlockUserMedia()
        {
            var participantUser = GetUserFromConferenceDetails(UserRole.Individual.ToString());

            var request = new CallbackEventRequestBuilder()
                .WithConferenceId(_c.Test.NewConferenceId)
                .WithParticipantId(participantUser.Id)
                .WithEventType(EventType.MediaPermissionDenied)
                .Build();

            new ExecuteEventBuilder()
                .WithContext(_c)
                .WithScenarioContext(_scenarioContext)
                .WithRequest(request)
                .SendToVideoApi();
        }

        [When(@"the judge has disconnected from the hearing")]
        public void WhenTheJudgeHasSuspendedTheHearing()
        {
            var request = new CallbackEventRequestBuilder()
                .WithConferenceId(_c.Test.NewConferenceId)
                .WithParticipantId(GetClerkParticipantId())
                .WithEventType(EventType.Disconnected)
                .WithRoomType(RoomType.HearingRoom)
                .Build();

            new ExecuteEventBuilder()
                .WithContext(_c)
                .WithScenarioContext(_scenarioContext)
                .WithRequest(request)
                .SendToVideoWeb();
        }

        [When(@"a (.*) has disconnected from the (.*)")]
        public void WhenAParticipantHasDisconnectedFromTheHearing(string participant, RoomType room)
        {
            var participantUser = GetUserFromConferenceDetails(participant);

            var request = new CallbackEventRequestBuilder()
                .WithConferenceId(_c.Test.NewConferenceId)
                .WithParticipantId(participantUser.Id)
                .WithEventType(EventType.Disconnected)
                .WithRoomType(room)
                .Build();

            new ExecuteEventBuilder()
                .WithContext(_c)
                .WithScenarioContext(_scenarioContext)
                .WithRequest(request)
                .SendToVideoWeb();
        }

        [When(@"a participant has failed the self-test with (.*)")]
        public void WhenAParticipantHasFailedTheSelfTestWithReason(string reason)
        {
            var participant = GetUserFromConferenceDetails(UserRole.Individual.ToString());

            var request = new CallbackEventRequestBuilder()
                .WithConferenceId(_c.Test.NewConferenceId)
                .WithParticipantId(participant.Id)
                .WithEventType(EventType.SelfTestFailed)
                .WithReason(reason)
                .Build();

            new ExecuteEventBuilder()
                .WithContext(_c)
                .WithScenarioContext(_scenarioContext)
                .WithRequest(request)
                .SendToVideoApi();
        }

        private ParticipantDetailsResponse GetUserFromConferenceDetails(string userRole)
        {
            var participantUser = userRole.ToLower().Equals("judge") || userRole.ToLower().Equals("clerk")
                ? _c.Conference.Participants.Find(x => x.User_role.ToString().Equals(UserRole.Judge.ToString()))
                : _c.Conference.Participants.Find(x => x.User_role.ToString().Equals(UserRole.Individual.ToString()));

            if (participantUser.Id == null)
                throw new DataMisalignedException("Participant Id is not set");

            _scenarioContext.Add(ParticipantKey, participantUser);
            return participantUser;
        }

        [When(@"the user selects the (.*) alert")]
        public void WhenTheUserSelectsTheAlert(string alertType)
        {
            var alerts = GetAlerts();
            var alert = alerts.First(x => x.AlertType.ToLower().Contains(alertType.ToLower()));
            _browsers[_c.CurrentUser.Key].Driver.ClickAndWaitForPageToLoad(AdminPanelPage.AlertCheckbox(alert.Row + 1));
        }

        [When(@"the hearing has been closed")]
        public void WhenTheHearingHasBeenClosed()
        {
            var request = new CallbackEventRequestBuilder()
                .WithConferenceId(_c.Test.NewConferenceId)
                .WithParticipantId(GetClerkParticipantId())
                .WithEventType(EventType.Close)
                .WithRoomType(RoomType.HearingRoom)
                .Build();

            new ExecuteEventBuilder()
                .WithContext(_c)
                .WithScenarioContext(_scenarioContext)
                .WithRequest(request)
                .SendToVideoWeb();

            _scenarioContext.Remove(ParticipantKey);
            _scenarioContext.Remove(AlertTimeKey);
        }

        [Then(@"the Video Hearings Officer user should not see an alert")]
        public void ThenTheVideoHearingsOfficerUserShouldNotSeeAnAlert()
        {
            _browsers[_c.CurrentUser.Key].Driver.Navigate().Refresh();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(VhoHearingListPage.VideoHearingsOfficerSelectHearingButton(_c.Hearing.Cases.First().Number)).Click();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementNotVisible(AdminPanelPage.AlertsHeader).Should().BeTrue("Alerts box should not be visible.");
        }

        [Then(@"the Video Hearings Officer user should see a (.*) notification and a (.*) alert")]
        public void ThenTheVideoHearingsOfficerUserShouldSeeAnAlert(string notification, string alertType)
        {
            _browsers[_c.CurrentUser.Key].Driver.Navigate().Refresh();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(VhoHearingListPage.VideoHearingsOfficerNumberOfAlerts(_c.Hearing.Cases.First().Number)).Text.Should().Contain("Alert");
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(VhoHearingListPage.VideoHearingsOfficerAlertType(_c.Hearing.Cases.First().Number)).Text.Should().Be(notification.Equals("Suspended") ? notification : "Not Started");
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(VhoHearingListPage.VideoHearingsOfficerSelectHearingButton(_c.Hearing.Cases.First().Number)).Click();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(AdminPanelPage.ParticipantStatusTable, 60).Displayed.Should().BeTrue();

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
                alerts.First(x => x.AlertType.ToLower().Contains(alertType.ToLower())).Username.Should().Be(_scenarioContext.Get<ParticipantDetailsResponse>(ParticipantKey).Name);
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
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementsVisible(VhoHearingListPage.VhoHearingRows).Count.Should().Be(count);
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
            alert.ActionedBy.Should().Be(_c.CurrentUser.Username.ToLower());
        }

        private Guid? GetClerkParticipantId()
        {
            return _c.Conference.Participants.Find(x => x.User_role.ToString().Equals(UserRole.Judge.ToString())).Id;
        }

        private List<Alert> GetAlerts()
        {
            var rowsCount = _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementsVisible(AdminPanelPage.AlertRows).Count;
            rowsCount.Should().BeGreaterThan(0);
            var alerts = new List<Alert>();

            for (var i = 0; i < rowsCount; i++)
            {
                var alert = new Alert
                {
                    Row = i,
                    Checkbox = _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementsVisible(AdminPanelPage.AlertCheckboxes)[i],
                    Timestamp = _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementsVisible(AdminPanelPage.AlertTimestamp)[i].Text,
                    AlertType = _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementsVisible(AdminPanelPage.AlertMessage)[i].Text,
                    Username = _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementsVisible(AdminPanelPage.AlertByUser)[i].Text
                };
                if (!_browsers[_c.CurrentUser.Key].Driver.WaitUntilElementsVisible(AdminPanelPage.AlertCheckboxes)[i].Enabled)
                {
                    var actionedByDetails = _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(AdminPanelPage.ActionedBy(alert.AlertType)).Text;
                    alert.ActionedBy = actionedByDetails.Split(" ")[0].Trim();
                    alert.ActionedAt = actionedByDetails.Split(" ")[1].Trim();
                }
                alerts.Add(alert);
            }

            return alerts;
        }
    }
}
