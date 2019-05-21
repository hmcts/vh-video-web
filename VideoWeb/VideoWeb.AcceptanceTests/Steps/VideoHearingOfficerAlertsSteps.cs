using System;
using System.Linq;
using System.Net;
using FizzWare.NBuilder;
using FluentAssertions;
using RestSharp.Extensions;
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
        private const string Judge = "judge";
        private const string Participant = "participant";
        private const string AlertTime = "alert time";

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
            GetParticipant();
            var request = CreateEventRequest();
            request.Event_type = EventType.MediaPermissionDenied;
            request.Participant_id = _scenarioContext.Get<ParticipantDetailsResponse>(Participant).Id.ToString();
            ExecuteRequest(request);
        }

        [When(@"the judge has disconnected from the hearing")]
        public void WhenTheJudgeHasSuspendedTheHearing()
        {
            GetJudge();
            var request = CreateEventRequest();
            request.Event_type = EventType.Disconnected;
            request.Participant_id = _scenarioContext.Get<ParticipantDetailsResponse>(Judge).Id.ToString();
            ExecuteRequest(request);
        }

        [When(@"a participant has disconnected from the hearing")]
        public void WhenAParticipantHasDisconnectedFromTheHearing()
        {
            ScenarioContext.Current.Pending();
        }

        [When(@"a participant has failed the self-test")]
        public void WhenAParticipantHasFailedTheSelf_Test()
        {
            ScenarioContext.Current.Pending();
        }

        [When(@"the user selects the alert")]
        public void WhenTheUserSelectsTheAlert()
        {
            _browserContext.NgDriver.ClickAndWaitForPageToLoad(_adminPanelPage.AlertCheckbox);
        }

        [Then(@"the Video Hearings Officer user should see a (.*) alert")]
        public void ThenTheVideoHearingsOfficerUserShouldSeeAnAlert(string alertType)
        {
            _browserContext.NgDriver.Navigate().Refresh();

            _browserContext.NgDriver
                .WaitUntilElementVisible(
                    _hearingListPage.VideoHearingsOfficerNumberofAlerts(_context.Hearing.Cases.First().Number))
                .Text.Should().Be("1 Alert");

            _browserContext.NgDriver
                .WaitUntilElementVisible(
                    _hearingListPage.VideoHearingsOfficerAlertType(_context.Hearing.Cases.First().Number))
                .Text.Should().Be(alertType.Equals("Suspended") ? alertType : "Ready");

            _browserContext.NgDriver
                .WaitUntilElementVisible(
                    _hearingListPage.VideoHearingsOfficerSelectHearingButton(_context.Hearing.Cases.First().Number))
                .Click();

            _browserContext.NgDriver.WaitUntilElementVisible(_hearingListPage.AdminIframe).Displayed.Should().BeTrue();
            _browserContext.NgDriver.WaitUntilElementExists(_adminPanelPage.AlertCheckbox).Selected.Should().BeFalse();
            _browserContext.NgDriver.WaitUntilElementExists(_adminPanelPage.AlertCheckbox).Enabled.Should().BeTrue();
            _browserContext.NgDriver.WaitUntilElementVisible(_adminPanelPage.AlertTimestamp).Text
                .Should().Be(
                    $"{_scenarioContext.Get<DateTime>(AlertTime).ToString(DateFormats.AlertMessageTimestamp)}");
            _browserContext.NgDriver.WaitUntilElementVisible(_adminPanelPage.AlertMessage(alertType)).Text.ToLower()
                .Should().Contain(alertType.ToLower());

            if (alertType.Equals("Blocked media"))
            {
                _browserContext.NgDriver.WaitUntilElementExists(_adminPanelPage.AlertBy(_scenarioContext.Get<ParticipantDetailsResponse>(Participant).Id.ToString())).Displayed.Should().BeTrue();
            }
        }

        [Then(@"the checkbox is no longer enabled")]
        public void ThenTheCheckboxIsNoLongerEnabled()
        {
            _browserContext.NgDriver.WaitUntilElementExists(_adminPanelPage.AlertCheckbox).Enabled.Should().BeFalse();
        }

        [Then(@"the alert should be updated with the details of the user that actioned the alert")]
        public void ThenTheAlertShouldBeUpdatedWithTheDetailsOfTheUserThatActionedTheAlert()
        {
            _browserContext.NgDriver.WaitUntilElementVisible(
                _adminPanelPage.CompletedByTimestamp).Text.Should().Be(DateTime.Now.ToString(DateFormats.AlertMessageTimestamp));

            _browserContext.NgDriver.WaitUntilElementVisible(
                _adminPanelPage.CompletedByUser).Text.Should().Be(_context.CurrentUser.Username.ToLower());
        }

        private void GetParticipant()
        {
            _scenarioContext.Add(Participant, _context.Conference.Participants.Find(x =>
                x.User_role.Equals(UserRole.Individual) || x.User_role.Equals(UserRole.Representative)));
        }

        private void GetJudge()
        {
            _scenarioContext.Add(Judge, _context.Conference.Participants.Find(x =>
                x.User_role.Equals(UserRole.Judge)));
        }

        private ConferenceEventRequest CreateEventRequest()
        {
            var request = Builder<ConferenceEventRequest>.CreateNew()
                .With(x => x.Conference_id = _context.NewConferenceId.ToString())
                .With(x => x.Event_id = Guid.NewGuid().ToString())
                .With(x => x.Transfer_from = RoomType.WaitingRoom)
                .With(x => x.Transfer_to = RoomType.WaitingRoom)
                .With(x => x.Reason = "Automated")
                .Build();
            return request;
        }

        private void ExecuteRequest(ConferenceEventRequest request)
        {
            _context.Request = _context.Post(_callbackEndpoints.Event, request);
            _context.Response = _context.VideoApiClient().Execute(_context.Request);
            _scenarioContext.Add(AlertTime, DateTime.Now);
            _context.Response.StatusCode.Should().Be(HttpStatusCode.NoContent);
            _context.Response.IsSuccessful.Should().Be(true);
        }
    }
}
