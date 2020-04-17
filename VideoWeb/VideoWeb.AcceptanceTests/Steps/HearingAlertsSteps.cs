using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using AcceptanceTests.Common.Api.Hearings;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using OpenQA.Selenium;
using RestSharp;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Builders;
using VideoWeb.AcceptanceTests.Configuration;
using VideoWeb.AcceptanceTests.Data;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Models;
using VideoWeb.Services.Video;
using EventType = VideoWeb.EventHub.Enums.EventType;
using RoomType = VideoWeb.EventHub.Enums.RoomType;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class HearingAlertsSteps
    {
        private const int Timeout = 10;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _c;

        public HearingAlertsSteps(Dictionary<string, UserBrowser> browsers, TestContext context)
        {
            _browsers = browsers;
            _c = context;
        }

        [When(@"a participant has chosen to block user media")]
        public void WhenAParticipantHasChosenToBlockUserMedia()
        {
            var participantUser = GetUserFromConferenceDetails(Role.Individual.ToString());

            var request = new CallbackEventRequestBuilder()
                .WithConferenceId(_c.Test.NewConferenceId)
                .WithParticipantId(participantUser.Id)
                .WithEventType(EventType.MediaPermissionDenied)
                .Build();

            var response = SendEventToVideoApi(request);
            response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        }

        [When(@"the hearing is suspended")]
        public void WhenTheTheHearingIsSuspended()
        {
            var request = new CallbackEventRequestBuilder()
                .WithConferenceId(_c.Test.NewConferenceId)
                .WithParticipantId(GetClerkParticipantId())
                .WithEventType(EventType.Suspend)
                .WithRoomType(RoomType.HearingRoom)
                .Build();

            var response = SendEventToVideoWeb(request);
            response.StatusCode.Should().Be(HttpStatusCode.NoContent);
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

            var response = SendEventToVideoWeb(request);
            response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        }

        [When(@"a participant has failed the self-test with (.*)")]
        public void WhenAParticipantHasFailedTheSelfTestWithReason(string reason)
        {
            var participant = GetUserFromConferenceDetails(Role.Individual.ToString());

            var request = new CallbackEventRequestBuilder()
                .WithConferenceId(_c.Test.NewConferenceId)
                .WithParticipantId(participant.Id)
                .WithEventType(EventType.SelfTestFailed)
                .WithReason(reason)
                .Build();

            var response = SendEventToVideoApi(request);
            response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        }

        private ParticipantDetailsResponse GetUserFromConferenceDetails(string userRole)
        {
            _c.Test.Participant = userRole.ToLower().Equals("judge") || userRole.ToLower().Equals("clerk")
                ? _c.Test.ConferenceParticipants.Find(x => x.User_role.ToString().Equals(Role.Judge.ToString()))
                : _c.Test.ConferenceParticipants.Find(x => x.User_role.ToString().Equals(Role.Individual.ToString()));

            return _c.Test.Participant;
        }

        [When(@"the user selects the (.*) alert")]
        public void WhenTheUserSelectsTheAlert(string alertType)
        {
            var alerts = GetAlerts();
            var alert = alerts.First(x => x.AlertType.ToLower().Contains(alertType.ToLower()));
            _browsers[_c.CurrentUser.Key].ClickCheckbox(AdminPanelPage.AlertCheckbox(alert.Row + 1));
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

            var response = SendEventToVideoWeb(request);
            response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        }

        [Then(@"the Video Hearings Officer user should not see an alert")]
        public void ThenTheVideoHearingsOfficerUserShouldNotSeeAnAlert()
        {
            _browsers[_c.CurrentUser.Key].Refresh();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(VhoHearingListPage.SelectHearingButton(_c.Test.Conference.Id)).Click();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementNotVisible(AdminPanelPage.AlertsHeader).Should().BeTrue("Alerts box should not be visible.");
        }

        [Then(@"the Video Hearings Officer user should see a (.*) notification and a (.*) alert")]
        public void ThenTheVideoHearingsOfficerUserShouldSeeAnAlert(string notification, string alertType)
        {
            _browsers[_c.CurrentUser.Key].Refresh();
            _browsers[_c.CurrentUser.Key].Driver.WaitForAngular();
            var alertCount =_browsers[_c.CurrentUser.Key].Driver
                .WaitUntilElementExists(VhoHearingListPage.NumberOfAlerts(_c.Test.Conference.Id))
                .GetAttribute("data-badge");
            int.Parse(alertCount).Should().BePositive();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(VhoHearingListPage.StatusBadge(_c.Test.Conference.Id)).Text.Should().Be(notification.Equals("Suspended") ? notification : "Not Started");
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(VhoHearingListPage.SelectHearingButton(_c.Test.Conference.Id)).Click();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(AdminPanelPage.ParticipantStatusTable, 60).Displayed.Should().BeTrue();

            var alerts = GetAlerts();
            var timeOfAlert = _c.TimeZone.AdjustForVideoWeb(_c.Test.AlertTime).ToString(DateFormats.AlertMessageTimestamp);
            var timeOfAlertMinusAMinute = _c.TimeZone.AdjustForVideoWeb(_c.Test.AlertTime).AddMinutes(-1).ToString(DateFormats.AlertMessageTimestamp);
            var timeOfAlertPlusAMinute = _c.TimeZone.AdjustForVideoWeb(_c.Test.AlertTime).AddMinutes(1).ToString(DateFormats.AlertMessageTimestamp);

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
                alerts.First(x => x.AlertType.ToLower().Contains(alertType.ToLower())).Username.Should().Be(_c.Test.Participant.Name);
            }
        }

        [Then(@"the (.*) checkbox is no longer enabled")]
        public void ThenTheCheckboxIsNoLongerEnabled(string alertType)
        {
            CheckboxShouldBeDisabled(alertType);
        }

        [Then(@"the (.*) alert should be updated with the details of the user that actioned the alert")]
        public void ThenTheAlertShouldBeUpdatedWithTheDetailsOfTheUserThatActionedTheAlert(string alertType)
        {
            var alerts = GetAlerts();
            var alert = alerts.First(x => x.AlertType.ToLower().Contains(alertType.ToLower()));
            var time = _c.TimeZone.Adjust(DateTime.Now).ToString(DateFormats.AlertMessageTimestamp);
            var timeMinusAMinute = _c.TimeZone.Adjust(DateTime.Now).AddMinutes(-1).ToString(DateFormats.AlertMessageTimestamp);
            var timePlusAMinute = _c.TimeZone.Adjust(DateTime.Now).AddMinutes(1).ToString(DateFormats.AlertMessageTimestamp);
            alert.ActionedAt.Should().Match<string>(t => t.Equals(time) || t.Equals(timeMinusAMinute) || t.Equals(timePlusAMinute));
            alert.ActionedBy.Should().Be(_c.CurrentUser.Username.ToLower());
        }

        private Guid? GetClerkParticipantId()
        {
            return _c.Test.ConferenceParticipants.Find(x => x.User_role.ToString().Equals(Role.Judge.ToString())).Id;
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
                    CheckboxEnabled = TryGetEnabledStatus(i),
                    Timestamp = _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementsVisible(AdminPanelPage.AlertTimestamp)[i].Text,
                    AlertType = _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementsVisible(AdminPanelPage.AlertMessage)[i].Text.Trim(),
                    Username = _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementsVisible(AdminPanelPage.AlertByUser)[i].Text.Trim()
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

        private bool TryGetEnabledStatus(int row)
        {
            try
            {
                return _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementsVisible(AdminPanelPage.AlertCheckboxes)[row].Enabled;
            }
            catch
            {
                return false;
            }
        }

        private IRestResponse SendEventToVideoApi(CallbackEvent request)
        {
            _c.Test.AlertTime = _c.TimeZone.Adjust(DateTime.Now);
            return _c.Apis.VideoApi.SendEvent(request);
        }

        private IRestResponse SendEventToVideoWeb(CallbackEvent request)
        {
            _c.Test.AlertTime = _c.TimeZone.Adjust(DateTime.Now);
            _c.Tokens.CallbackBearerToken = GenerateTemporaryTokens.SetCustomJwTokenForCallback(_c.VideoWebConfig.VideoWebKinlyConfiguration);
            return new VideoWebApiManager(_c.VideoWebConfig.VhServices.VideoWebUrl, _c.Tokens.CallbackBearerToken).SendCallBackEvent(request);
        }

        private void CheckboxShouldBeDisabled(string alertType)
        {
            for (var i = 0; i < Timeout; i++)
            {
                var alerts = GetAlerts();
                var alert = alerts.First(x => x.AlertType.ToLower().Contains(alertType.ToLower()));
                if (alert.CheckboxEnabled.Equals(false))
                {
                    return;
                }
                Thread.Sleep(TimeSpan.FromSeconds(1));
            }

            throw new InvalidElementStateException($"Alert is still enabled after {Timeout} seconds.");
        }
    }
}
