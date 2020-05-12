using System;
using System.Collections.Generic;
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
using VideoWeb.Common.Extensions;
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
        private const int TimeoutForCheckboxToNotBeEnabled = 10;
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
            Tasks.GetTheTaskId(_c, EventType.MediaPermissionDenied);
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
            Tasks.GetTheTaskId(_c, EventType.Suspend);
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
            Tasks.GetTheTaskId(_c, EventType.Disconnected);
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
            Tasks.GetTheTaskId(_c, EventType.SelfTestFailed);
        }

        private ParticipantDetailsResponse GetUserFromConferenceDetails(string userRole)
        {
            _c.Test.Participant = userRole.ToLower().Equals("judge") || userRole.ToLower().Equals("clerk")
                ? _c.Test.ConferenceParticipants.Find(x => x.User_role.ToString().Equals(Role.Judge.ToString()))
                : _c.Test.ConferenceParticipants.Find(x => x.User_role.ToString().Equals(Role.Individual.ToString()));
            return _c.Test.Participant;
        }

        [When(@"the user selects the alert")]
        public void WhenTheUserSelectsTheAlert()
        {
            _browsers[_c.CurrentUser.Key].ClickCheckbox(AdminPanelPage.TaskCheckbox(_c.Test.TaskId));
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
            Scrolling.ScrollToTheHearing(_browsers[_c.CurrentUser.Key], _c.Test.Conference.Id);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(VhoHearingListPage.SelectHearingButton(_c.Test.Conference.Id)).Click();
            Scrolling.ScrollToTheTopOfThePage(_browsers[_c.CurrentUser.Key]);
            Tasks.TasksListShouldBeEmpty(_c, EventType.Close);
        }

        [Then(@"the Video Hearings Officer user should see a (.*) notification and a (.*) alert")]
        public void ThenTheVideoHearingsOfficerUserShouldSeeAnAlert(string notification, string alertType)
        {
            _browsers[_c.CurrentUser.Key].Refresh();
            _browsers[_c.CurrentUser.Key].Driver.WaitForAngular();
            Scrolling.ScrollToTheHearing(_browsers[_c.CurrentUser.Key], _c.Test.Conference.Id);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(VhoHearingListPage.StatusBadge(_c.Test.Conference.Id)).Text.Should().Be(notification.Equals("Suspended") ? notification : "Not Started");
            _browsers[_c.CurrentUser.Key].Click(VhoHearingListPage.SelectHearingButton(_c.Test.Conference.Id));
            Scrolling.ScrollToTheTopOfThePage(_browsers[_c.CurrentUser.Key]);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(AdminPanelPage.ParticipantStatusTable, 60).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(AdminPanelPage.TaskDetails(_c.Test.TaskId)).Text.Trim().Should().Be(alertType);

            var timeOfAlert = _c.TimeZone.AdjustForVideoWeb(_c.Test.AlertTime).ToString(DateFormats.AlertMessageTimestamp);
            var timeOfAlertMinusAMinute = _c.TimeZone.AdjustForVideoWeb(_c.Test.AlertTime).AddMinutes(-1).ToString(DateFormats.AlertMessageTimestamp);
            var timeOfAlertPlusAMinute = _c.TimeZone.AdjustForVideoWeb(_c.Test.AlertTime).AddMinutes(1).ToString(DateFormats.AlertMessageTimestamp);

            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementExists(AdminPanelPage.TaskCheckbox(_c.Test.TaskId)).Selected.Should().BeFalse();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementExists(AdminPanelPage.TaskCheckbox(_c.Test.TaskId)).Enabled.Should().BeTrue();
            
            var timestamp = _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(AdminPanelPage.TaskCreatedDate(_c.Test.TaskId)).Text.Trim();
            timestamp.Should().BeOneOf(timeOfAlert, timeOfAlertMinusAMinute, timeOfAlertPlusAMinute);

            if (alertType.ToLower().Contains("failed self-test") || alertType.ToLower().Equals("disconnected"))
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(AdminPanelPage.TaskFromUser(_c.Test.TaskId)).Text.Trim().Should().Be(_c.Test.Participant.Name);
        }

        [Then(@"the alert checkbox is no longer enabled")]
        public void ThenTheCheckboxIsNoLongerEnabled()
        {
            for (var i = 0; i < TimeoutForCheckboxToNotBeEnabled; i++)
            {
                if (!IsEnabled())
                {
                    return;
                }
                Thread.Sleep(TimeSpan.FromSeconds(1));
            }

            throw new InvalidElementStateException($"Alert is still enabled after {TimeoutForCheckboxToNotBeEnabled} seconds.");
        }

        private bool IsEnabled()
        {
            try
            {
                return _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementExists(AdminPanelPage.TaskCheckbox(_c.Test.TaskId)).Enabled;
            }
            catch (StaleElementReferenceException e)
            {
                Console.WriteLine(e);
                return false;
            }
        }

        [Then(@"the alert should be updated with the details of the user that actioned the alert")]
        public void ThenTheAlertShouldBeUpdatedWithTheDetailsOfTheUserThatActionedTheAlert()
        {
            var time = _c.TimeZone.Adjust(DateTime.Now).ToString(DateFormats.AlertMessageTimestamp);
            var timeMinusAMinute = _c.TimeZone.Adjust(DateTime.Now).AddMinutes(-1).ToString(DateFormats.AlertMessageTimestamp);
            var timePlusAMinute = _c.TimeZone.Adjust(DateTime.Now).AddMinutes(1).ToString(DateFormats.AlertMessageTimestamp);
            var actionedDetails = _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(AdminPanelPage.TaskActionedBy(_c.Test.TaskId)).Text.Trim();
            actionedDetails.Should().ContainAny(time, timeMinusAMinute, timePlusAMinute);
            actionedDetails.ToLower().Should().Contain(_c.CurrentUser.Username.WithoutDomain().ToLower());
        }

        private Guid GetClerkParticipantId()
        {
            return _c.Test.ConferenceParticipants.Find(x => x.User_role.ToString().Equals(Role.Judge.ToString())).Id;
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
    }
}
