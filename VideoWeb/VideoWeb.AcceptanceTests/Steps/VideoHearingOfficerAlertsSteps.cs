using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using FizzWare.NBuilder;
using FluentAssertions;
using OpenQA.Selenium;
using OpenQA.Selenium.Interactions;
using TechTalk.SpecFlow;
using Testing.Common.Builders;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class VideoHearingOfficerAlertsSteps
    {
        private readonly BrowserContext _browserContext;
        private readonly TestContext _context;
        private readonly ScenarioContext _scenarioContext;
        private readonly HearingListPage _hearingListPage;
        private readonly AdminPanelPage _adminPanelPage;
        private readonly CallbackEndpoints _callbackEndpoints = new VideoApiUriFactory().CallbackEndpoints;
        private const string ParticipantKey = "participant";
        private const string AlertTimeKey = "alert time";

        public VideoHearingOfficerAlertsSteps(BrowserContext browserContext, TestContext context, ScenarioContext scenarioContext,
            HearingListPage hearingListPage, AdminPanelPage adminPanelPage)
        {
            _browserContext = browserContext;
            _context = context;
            _scenarioContext = scenarioContext;
            _hearingListPage = hearingListPage;
            _adminPanelPage = adminPanelPage;
        }

        [When(@"a participant has chosen to block user media")]
        public void WhenAParticipantHasChosenToBlockUserMedia()
        {
            GetParticipant(UserRole.Individual);
            var request = CreateEventRequest();
            request.Event_type = EventType.MediaPermissionDenied;
            ExecuteRequest(request);
        }

        [When(@"the judge has disconnected from the hearing")]
        public void WhenTheJudgeHasSuspendedTheHearing()
        {
            GetParticipant(UserRole.Judge);
            var request = CreateEventRequest(RoomType.HearingRoom);
            request.Event_type = EventType.Disconnected;
            ExecuteRequest(request);
        }

        [When(@"a (.*) has disconnected from the (.*)")]
        public void WhenAParticipantHasDisconnectedFromTheHearing(string participant, RoomType room)
        {
            GetParticipant(participant.Equals("Judge") ? UserRole.Judge : UserRole.Individual);
            var request = CreateEventRequest(room);
            request.Event_type = EventType.Disconnected;
            ExecuteRequest(request);
        }

        [When(@"a participant has failed the self-test")]
        public void WhenAParticipantHasFailedTheSelf_Test()
        {
            ScenarioContext.Current.Pending();
        }

        [When(@"the user selects the (.*) alert")]
        public void WhenTheUserSelectsTheAlert(string alertType)
        {
            var alerts = GetAlerts();
            var alert = alerts.First(x => x.AlertType.ToLower().Equals(alertType.ToLower()));
            _browserContext.NgDriver.ClickAndWaitForPageToLoad(_adminPanelPage.AlertCheckbox(alert.Row + 1));
        }

        [When(@"the hearing has been closed")]
        public void WhenTheHearingHasBeenClosed()
        {
            GetParticipant(UserRole.Judge);
            var request = CreateEventRequest(RoomType.HearingRoom);
            request.Event_type = EventType.Close;
            ExecuteRequest(request);
            _scenarioContext.Remove(ParticipantKey);
            _scenarioContext.Remove(AlertTimeKey);
        }

        [Then(@"the Video Hearings Officer user should not see an alert")]
        public void ThenTheVideoHearingsOfficerUserShouldNotSeeAnAlert()
        {
            _browserContext.NgDriver.Navigate().Refresh();
            ScenarioContext.Current.Pending();
        }

        [Then(@"the Video Hearings Officer user should see a (.*) notification and a (.*) alert")]
        public void ThenTheVideoHearingsOfficerUserShouldSeeAnAlert(string notification, string alertType)
        {
            _browserContext.NgDriver.Navigate().Refresh();

            _browserContext.NgDriver
                .WaitUntilElementVisible(
                    _hearingListPage.VideoHearingsOfficerNumberofAlerts(_context.Hearing.Cases.First().Number))
                .Text.Should().Contain("Alert");

            _browserContext.NgDriver
                .WaitUntilElementVisible(
                    _hearingListPage.VideoHearingsOfficerAlertType(_context.Hearing.Cases.First().Number))
                .Text.Should().Be(notification.Equals("Suspended") ? notification : "Ready");

            _browserContext.NgDriver
                .WaitUntilElementVisible(
                    _hearingListPage.VideoHearingsOfficerSelectHearingButton(_context.Hearing.Cases.First().Number))
                .Click();

            _browserContext.NgDriver.WaitUntilElementVisible(_hearingListPage.AdminIframe).Displayed.Should().BeTrue();

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

            if (alertType.Equals("Blocked media") || alertType.Equals("Disconnected"))
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

        [Then(@"the (.*) alert should be updated with the details of the user that actioned the alert")]
        public void ThenTheAlertShouldBeUpdatedWithTheDetailsOfTheUserThatActionedTheAlert(string alertType)
        {
            var alerts = GetAlerts();
            var alert = alerts.First(x => x.AlertType.ToLower().Equals(alertType.ToLower()));
            var time = DateTime.Now.ToString(DateFormats.AlertMessageTimestamp);
            var timeMinusAMinute = DateTime.Now.AddMinutes(-1).ToString(DateFormats.AlertMessageTimestamp);
            var timePlusAMinute = DateTime.Now.AddMinutes(1).ToString(DateFormats.AlertMessageTimestamp);
            alert.ActionedAt.Should().Match<string>(t => t.Equals(time) || t.Equals(timeMinusAMinute) || t.Equals(timePlusAMinute));
            alert.ActionedBy.Should().Be(_context.CurrentUser.Username.ToLower());
        }

        private void GetParticipant(UserRole role)
        {
            if (role.Equals(UserRole.Judge))
            {
                _scenarioContext.Add(ParticipantKey, _context.Conference.Participants.Find(x =>
                    x.User_role.Equals(UserRole.Judge)));
            }
            else
            {
                _scenarioContext.Add(ParticipantKey, _context.Conference.Participants.Find(x =>
                    x.User_role.Equals(UserRole.Individual) || x.User_role.Equals(UserRole.Representative)));
            }
        }

        private ConferenceEventRequest CreateEventRequest(RoomType roomtype = RoomType.WaitingRoom)
        {
            var request = Builder<ConferenceEventRequest>.CreateNew()
                .With(x => x.Conference_id = _context.NewConferenceId.ToString())
                .With(x => x.Participant_id = _scenarioContext.Get<ParticipantDetailsResponse>(ParticipantKey).Id.ToString())
                .With(x => x.Event_id = Guid.NewGuid().ToString())
                .With(x => x.Transfer_from = roomtype)
                .With(x => x.Transfer_to = roomtype)
                .With(x => x.Reason = "Automated")
                .Build();
            return request;
        }

        private void ExecuteRequest(ConferenceEventRequest request)
        {
            _context.Request = _context.Post(_callbackEndpoints.Event, request);
            _context.Response = _context.VideoApiClient().Execute(_context.Request);
            _scenarioContext.Add(AlertTimeKey, DateTime.Now);
            _context.Response.StatusCode.Should().Be(HttpStatusCode.NoContent);
            _context.Response.IsSuccessful.Should().Be(true);
        }

        private List<Alert> GetAlerts()
        {
            var rowsCount = _browserContext.NgDriver.WaitUntilElementsVisible(_adminPanelPage.AlertRows).Count;
            rowsCount.Should().BeGreaterThan(0);
            var alerts = new List<Alert>();

            for (var i = 0; i < rowsCount; i++)
            {
                var alert = new Alert
                {
                    Row = i,
                    Checkbox = _browserContext.NgDriver.WaitUntilElementsVisible(_adminPanelPage.AlertCheckboxes)[i],
                    Timestamp = _browserContext.NgDriver.WaitUntilElementsVisible(_adminPanelPage.AlertTimestamp)[i].Text,
                    AlertType = _browserContext.NgDriver.WaitUntilElementsVisible(_adminPanelPage.AlertMessage)[i].Text,
                    Username = _browserContext.NgDriver.WaitUntilElementsVisible(_adminPanelPage.AlertByUser)[i].Text
                };
                if (!_browserContext.NgDriver.WaitUntilElementsVisible(_adminPanelPage.AlertCheckboxes)[i].Enabled)
                {
                    alert.ActionedAt = _browserContext.NgDriver.WaitUntilElementVisible(_adminPanelPage.ActionedByTimestamp(alert.AlertType)).Text;
                    alert.ActionedBy = _browserContext.NgDriver.WaitUntilElementVisible(_adminPanelPage.ActionedByUser(alert.AlertType)).Text;
                }
                alerts.Add(alert);
            }

            return alerts;
        }
    }
}
