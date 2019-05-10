using System;
using System.Linq;
using System.Net;
using FizzWare.NBuilder;
using FluentAssertions;
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
            _scenarioContext.Add(Participant, _context.Conference.Participants.Find(x =>
                x.User_role.Equals(UserRole.Individual) || x.User_role.Equals(UserRole.Representative)));
            var request = Builder<ConferenceEventRequest>.CreateNew()
                .With(x => x.Conference_id = _context.NewConferenceId.ToString())
                .With(x => x.Participant_id = _scenarioContext.Get<ParticipantDetailsResponse>(Participant).Id.ToString())
                .With(x => x.Event_id = Guid.NewGuid().ToString())
                .With(x => x.Event_type = EventType.MediaPermissionDenied)
                .With(x => x.Transfer_from = RoomType.WaitingRoom)
                .With(x => x.Transfer_to = RoomType.WaitingRoom)
                .With(x => x.Reason = "Automated")
                .Build();
            _context.Request = _context.Post(_callbackEndpoints.Event, request);
            _context.Response = _context.VideoApiClient().Execute(_context.Request);
            _scenarioContext.Add(AlertTime, DateTime.Now);
            _context.Response.StatusCode.Should().Be(HttpStatusCode.NoContent);
            _context.Response.IsSuccessful.Should().Be(true);
        }

        [Then(@"the Video Hearings Officer user should see an alert")]
        public void ThenTheVideoHearingsOfficerUserShouldSeeAnAlert()
        {
            _browserContext.NgDriver.Navigate().Refresh();

            _browserContext.NgDriver
                .WaitUntilElementVisible(
                    _hearingListPage.VideoHearingsOfficerSelectHearingButton(_context.Hearing.Cases.First().Number))
                .Click();
            _browserContext.NgDriver.WaitUntilElementVisible(_hearingListPage.AdminIframe).Displayed.Should().BeTrue();

            _browserContext.NgDriver.WaitUntilElementVisible(_adminPanelPage.AlertTimestamp).Text
                .Should().Be(
                    $"{_scenarioContext.Get<DateTime>(AlertTime).ToString(DateFormats.AlertMessageTimestamp)}");
            _browserContext.NgDriver.WaitUntilElementVisible(
                _adminPanelPage.AlertMessage(_scenarioContext.Get<ParticipantDetailsResponse>(Participant).Name)).Displayed.Should().BeTrue();
            _browserContext.NgDriver.WaitUntilElementVisible(
                _adminPanelPage.AlertType(_scenarioContext.Get<ParticipantDetailsResponse>(Participant).User_role.ToString())).Displayed.Should().BeTrue();
        }
    }
}
