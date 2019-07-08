using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using FizzWare.NBuilder;
using FluentAssertions;
using TechTalk.SpecFlow;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.Services.Video;
using UserRole = VideoWeb.Services.Video.UserRole;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class ParticipantStatusSteps
    {
        private readonly TestContext _context;
        private readonly BrowserContext _browserContext;
        private readonly ScenarioContext _scenarioContext;
        private readonly AdminPanelPage _adminPanelPage;
        private readonly HearingListPage _hearingListPage;
        private readonly ConferenceEndpoints _conferenceEndpoints = new VideoApiUriFactory().ConferenceEndpoints;
        private readonly CallbackEndpoints _callbackEndpoints = new VideoApiUriFactory().CallbackEndpoints;
        private const string ParticipantsKey = "participants";
        private const int MaxRetries = 5;

        public ParticipantStatusSteps(TestContext testContext, BrowserContext browserContext,
            ScenarioContext injectedContext, AdminPanelPage adminPanelPage, HearingListPage hearingListPage)
        {
            _context = testContext;
            _browserContext = browserContext;
            _scenarioContext = injectedContext;
            _adminPanelPage = adminPanelPage;
            _hearingListPage = hearingListPage;
        }

        [When(@"the participants are (.*)")]
        public void WhenTheParticipantsStatusesChange(string action)
        {
            EventType eventType;
            var from = RoomType.WaitingRoom;
            var to = RoomType.WaitingRoom;

            switch (action)
            {
                case "Joining":
                {
                    eventType = EventType.ParticipantJoining;
                    break;
                }
                case "In Hearing":
                {
                    eventType = EventType.Transfer;
                    to = RoomType.HearingRoom;
                    break;
                }
                case "In Consultation":
                {
                    eventType = EventType.Transfer;
                    to = RoomType.ConsultationRoom1;
                    break;
                }
                case "Available":
                {
                    eventType = EventType.Transfer;
                    from = RoomType.HearingRoom;
                    break;
                }
                case "Disconnected":
                {
                    eventType = EventType.Disconnected;
                    break;
                }
                default: throw new ArgumentOutOfRangeException($"Action {action} is not defined");
            }

            var participants = _scenarioContext.Get<List<ParticipantDetailsResponse>>(ParticipantsKey);

            foreach (var participant in participants)
            {
                var request = Builder<ConferenceEventRequest>.CreateNew()
                    .With(x => x.Conference_id = _context.NewConferenceId.ToString())
                    .With(x => x.Participant_id = participant.Id.ToString())
                    .With(x => x.Event_id = Guid.NewGuid().ToString())
                    .With(x => x.Event_type = eventType)
                    .With(x => x.Transfer_from = from)
                    .With(x => x.Transfer_to = to)
                    .With(x => x.Reason = "Automated")
                    .Build();
                _context.Request = _context.Post(_callbackEndpoints.Event, request);
                _context.Response = _context.VideoApiClient().Execute(_context.Request);
                _context.Response.StatusCode.Should().Be(HttpStatusCode.NoContent);
                _context.Response.IsSuccessful.Should().Be(true);
            }
        }

        [Then(@"the participants statuses should be (.*)")]
        public void ThenTheParticipantsStatusesShouldBeNotJoined(string participantStatus)
        {
            _browserContext.NgDriver.WrappedDriver.SwitchTo().ParentFrame();
            _browserContext.NgDriver.WaitUntilElementVisible(_adminPanelPage.ParticipantStatusTable).Displayed.Should().BeTrue();

            var participants = _context.Conference.Participants.FindAll(x =>
                x.User_role == UserRole.Individual || x.User_role == UserRole.Representative);

            CheckParticipantStatus(participantStatus, participants);

            _scenarioContext.Add(ParticipantsKey, participants);
        }

        [Then(@"the participant status will be updated to Joining")]
        public void ThenTheParticipantStatusWillBeUpdatedToJoining()
        {
            _context.Request =
                _context.Get(_conferenceEndpoints.GetConferenceDetailsById(_context.NewConferenceId));

            var participantStatus = ParticipantState.None;

            for (var i = 0; i < MaxRetries; i++)
            {
                _context.Response = _context.VideoApiClient().Execute(_context.Request);
                _context.Response.IsSuccessful.Should().BeTrue();
                var conference =
                    ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<ConferenceDetailsResponse>(_context.Response
                        .Content);
                conference.Should().NotBeNull();

                var participant = conference.Participants
                    .Find(x => x.Username.ToLower().Equals(_context.CurrentUser.Username.ToLower()));

                if (participant.Current_status != null)
                {
                    var participantState = participant.Current_status
                        .Participant_state;
                    if (participantState != null)
                        participantStatus = (ParticipantState)participantState;
                    break;
                }
                Thread.Sleep(TimeSpan.FromSeconds(1));
            }

            if (participantStatus != ParticipantState.None)
            {
                participantStatus.Should().Be(ParticipantState.Joining);
            }
        }

        [Then(@"the participants statuses should update to (.*)")]
        public void ThenTheParticipantsStatusesShouldUpdateToDisconnected(string participantStatus)
        {
            _browserContext.NgDriver.Navigate().Refresh();
            _browserContext.NgDriver
                .WaitUntilElementVisible(
                    _hearingListPage.VideoHearingsOfficerSelectHearingButton(_context.Hearing.Cases.First().Number))
                .Click();

            _browserContext.NgDriver.WaitUntilElementVisible(_adminPanelPage.ParticipantStatusTable).Displayed.Should().BeTrue();

            var participants = _scenarioContext.Get<List<ParticipantDetailsResponse>>(ParticipantsKey);

            CheckParticipantStatus(participantStatus, participants);
        }

        private void CheckParticipantStatus(string participantStatus, IEnumerable<ParticipantDetailsResponse> participants)
        {
            foreach (var participant in participants)
            {
                var participantName = NameInCorrectFormat(participant);

                if (participant.Id != null)
                    _browserContext.NgDriver
                        .WaitUntilElementVisible(
                            _adminPanelPage.ParticipantStatus((Guid) participant.Id, participantName))
                        .Text.Trim().Should().Be(participantStatus);
            }
        }

        private static string NameInCorrectFormat(ParticipantDetailsResponse participant)
        {
            return $"{participant.Name} ({participant.Case_type_group})";
        }
    }
}
