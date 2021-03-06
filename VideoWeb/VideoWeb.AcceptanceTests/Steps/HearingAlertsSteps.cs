using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using AcceptanceTests.Common.Api.Hearings;
using AcceptanceTests.Common.Driver.Drivers;
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
using TestApi.Contract.Dtos;
using EventType = VideoWeb.EventHub.Enums.EventType;
using RoomType = VideoWeb.Common.Models.RoomType;
using VideoApi.Contract.Responses;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class HearingAlertsSteps
    {
        private const int TimeoutForCheckboxToNotBeEnabled = 10;
        private readonly Dictionary<UserDto, UserBrowser> _browsers;
        private readonly TestContext _c;

        public HearingAlertsSteps(Dictionary<UserDto, UserBrowser> browsers, TestContext context)
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
                .WithParticipantId(GetJudgeParticipantId())
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
            _c.Test.Participant = userRole.ToLower().Equals("judge") || userRole.ToLower().Equals("Judge")
                ? _c.Test.ConferenceParticipants.Find(x => x.UserRole.ToString().Equals(Role.Judge.ToString()))
                : _c.Test.ConferenceParticipants.Find(x => x.UserRole.ToString().Equals(Role.Individual.ToString()));
            return _c.Test.Participant;
        }

        [When(@"the user selects the alert")]
        public void WhenTheUserSelectsTheAlert()
        {
            _browsers[_c.CurrentUser].ClickCheckbox(AdminPanelPage.TaskCheckbox(_c.Test.TaskId));
        }

        [When(@"the hearing has been closed")]
        public void WhenTheHearingHasBeenClosed()
        {
            var request = new CallbackEventRequestBuilder()
                .WithConferenceId(_c.Test.NewConferenceId)
                .WithParticipantId(GetJudgeParticipantId())
                .WithEventType(EventType.Close)
                .WithRoomType(RoomType.HearingRoom)
                .Build();

            var response = SendEventToVideoWeb(request);
            response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        }

        [Then(@"the Video Hearings Officer user should not see an alert")]
        public void ThenTheVideoHearingsOfficerUserShouldNotSeeAnAlert()
        {
            _browsers[_c.CurrentUser].Refresh();
            Scrolling.ScrollToTheHearing(_browsers[_c.CurrentUser], _c.Test.Conference.Id);
            _browsers[_c.CurrentUser].Click(VhoHearingListPage.SelectHearingButton(_c.Test.Conference.Id));
            Scrolling.ScrollToTheTopOfThePage(_browsers[_c.CurrentUser]);
            Tasks.TasksListShouldBeEmpty(_c);
        }

        [Then(@"the Video Hearings Officer user should see a (.*) notification and a (.*) alert")]
        public void ThenTheVideoHearingsOfficerUserShouldSeeAnAlert(string notification, string alertType)
        {
            _browsers[_c.CurrentUser].Refresh();
            _browsers[_c.CurrentUser].Driver.WaitForAngular();
            Scrolling.ScrollToTheHearing(_browsers[_c.CurrentUser], _c.Test.Conference.Id);
            _browsers[_c.CurrentUser].TextOf(VhoHearingListPage.StatusBadge(_c.Test.Conference.Id)).Should().Be(notification.Equals("Suspended") ? notification : "Not Started");
            _browsers[_c.CurrentUser].Click(VhoHearingListPage.SelectHearingButton(_c.Test.Conference.Id));
            Scrolling.ScrollToTheTopOfThePage(_browsers[_c.CurrentUser]);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AdminPanelPage.ParticipantStatusTable, 60).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].TextOf(AdminPanelPage.TaskDetails(_c.Test.TaskId)).Should().Be(alertType);

            var timeOfAlert = _c.TimeZone.Adjust(_c.Test.AlertTime).ToString(DateFormats.AlertMessageTimestamp);
            var timeOfAlertMinusAMinute = _c.TimeZone.Adjust(_c.Test.AlertTime).AddMinutes(-1).ToString(DateFormats.AlertMessageTimestamp);
            var timeOfAlertPlusAMinute = _c.TimeZone.Adjust(_c.Test.AlertTime).AddMinutes(1).ToString(DateFormats.AlertMessageTimestamp);

            _browsers[_c.CurrentUser].Driver.WaitUntilElementExists(AdminPanelPage.TaskCheckbox(_c.Test.TaskId)).Selected.Should().BeFalse();
            _browsers[_c.CurrentUser].Driver.WaitUntilElementExists(AdminPanelPage.TaskCheckbox(_c.Test.TaskId)).Enabled.Should().BeTrue();

            var timestamp = _browsers[_c.CurrentUser].TextOf(AdminPanelPage.TaskCreatedDate(_c.Test.TaskId));
            timestamp.Should().BeOneOf(timeOfAlert, timeOfAlertMinusAMinute, timeOfAlertPlusAMinute);

            if (alertType.ToLower().Contains("failed self-test") || alertType.ToLower().Equals("disconnected"))
                _browsers[_c.CurrentUser].TextOf(AdminPanelPage.TaskFromUser(_c.Test.TaskId)).Should().Be(_c.Test.Participant.Name);
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
                return _browsers[_c.CurrentUser].Driver.WaitUntilElementExists(AdminPanelPage.TaskCheckbox(_c.Test.TaskId)).Enabled;
            }
            catch (StaleElementReferenceException e)
            {
                NUnit.Framework.TestContext.WriteLine(e);
                return false;
            }
        }

        [Then(@"the alert should be updated with the details of the user that actioned the alert")]
        public void ThenTheAlertShouldBeUpdatedWithTheDetailsOfTheUserThatActionedTheAlert()
        {
            var time = _c.TimeZone.Adjust(DateTime.Now).ToString(DateFormats.AlertMessageTimestamp);
            var timeMinusAMinute = _c.TimeZone.Adjust(DateTime.Now).AddMinutes(-1).ToString(DateFormats.AlertMessageTimestamp);
            var timePlusAMinute = _c.TimeZone.Adjust(DateTime.Now).AddMinutes(1).ToString(DateFormats.AlertMessageTimestamp);
            var actionedDetails = _browsers[_c.CurrentUser].TextOf(AdminPanelPage.TaskActionedBy(_c.Test.TaskId));
            actionedDetails.Should().ContainAny(time, timeMinusAMinute, timePlusAMinute);
            actionedDetails.ToLower().Should().Contain(_c.CurrentUser.Username.WithoutDomain().ToLower());
        }

        private Guid GetJudgeParticipantId()
        {
            return _c.Test.ConferenceParticipants.First(x => x.UserRole.ToString().Equals(Role.Judge.ToString())).Id;
        }

        private IRestResponse SendEventToVideoApi(CallbackEvent request)
        {
            _c.Test.AlertTime = _c.TimeZone.Adjust(DateTime.Now);
            return _c.Apis.TestApi.SendEvent(request);
        }

        private IRestResponse SendEventToVideoWeb(CallbackEvent request)
        {
            _c.Test.AlertTime = _c.TimeZone.Adjust(DateTime.Now);
            _c.Tokens.CallbackBearerToken = GenerateTemporaryTokens.SetCustomJwTokenForCallback(_c.VideoWebConfig.VideoWebKinlyConfiguration);
            return new VideoWebApiManager(_c.VideoWebConfig.VhServices.VideoWebUrl, _c.Tokens.CallbackBearerToken).SendCallBackEvent(request);
        }
    }
}
