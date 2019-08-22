using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using FluentAssertions;
using TechTalk.SpecFlow;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.AcceptanceTests.Strategies.ParticipantStatus;
using VideoWeb.AcceptanceTests.Users;
using VideoWeb.Common.Helpers;
using VideoWeb.Services.Video;
using UserRole = VideoWeb.Services.Video.UserRole;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class ParticipantStatusSteps
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _tc;
        private readonly ScenarioContext _scenario;
        private readonly AdminPanelPage _adminPanelPage;
        private readonly VhoHearingListPage _hearingListPage;
        private readonly ConferenceEndpoints _conferenceEndpoints = new VideoApiUriFactory().ConferenceEndpoints;
        private const string ParticipantsKey = "participants";
        private const int MaxRetries = 5;

        public ParticipantStatusSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext,
            ScenarioContext scenario, AdminPanelPage adminPanelPage, VhoHearingListPage hearingListPage)
        {
            _tc = testContext;
            _browsers = browsers;
            _scenario = scenario;
            _adminPanelPage = adminPanelPage;
            _hearingListPage = hearingListPage;
        }

        [When(@"the participants are (.*)")]
        public void WhenTheParticipantsStatusesChange(string action)
        {
            var participantStatuses = new Dictionary<string, IParticipantStatusStrategy>
            {
                {"Available", new AvailableStrategy()},
                {"Disconnected", new DisconnectedStrategy()},
                {"In Consultation", new InConsultationStrategy()},
                {"In Hearing", new InHearingStrategy()},
                {"Joining", new JoiningStrategy()}
            };

            var participants = _scenario.Get<List<ParticipantDetailsResponse>>(ParticipantsKey);

            foreach (var participant in participants)
            {
                participantStatuses[action].Execute(_tc, participant.Id.ToString());
            }
        }

        [Then(@"the participants statuses should be (.*)")]
        public void ThenTheParticipantsStatusesShouldBeNotJoined(string participantStatus)
        {
            _browsers[_tc.CurrentUser.Key].Driver.WrappedDriver.SwitchTo().ParentFrame();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_adminPanelPage.ParticipantStatusTable).Displayed.Should().BeTrue();

            var participants = _tc.Conference.Participants.FindAll(x =>
                x.User_role == UserRole.Individual || x.User_role == UserRole.Representative);

            CheckParticipantStatus(participantStatus, participants);

            _scenario.Add(ParticipantsKey, participants);
        }

        [Then(@"the participant status will be updated to (.*)")]
        public void ThenTheParticipantStatusWillBeUpdatedToJoining(ParticipantState expectedState)
        {
            _tc.Request =
                _tc.Get(_conferenceEndpoints.GetConferenceDetailsById(_tc.NewConferenceId));

            var participantStatus = ParticipantState.None;

            for (var i = 0; i < MaxRetries; i++)
            {
                _tc.Response = _tc.VideoApiClient().Execute(_tc.Request);
                _tc.Response.IsSuccessful.Should().BeTrue();
                var conference =
                    ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<ConferenceDetailsResponse>(_tc.Response
                        .Content);
                conference.Should().NotBeNull();

                var participant = conference.Participants
                    .Find(x => x.Username.ToLower().Equals(_tc.CurrentUser.Username.ToLower()));

                var participantState = participant.Current_status?.Participant_state;
                if (participantState != null && participantState.Equals(expectedState))
                {
                    participantStatus = (ParticipantState)participantState;
                    break;
                }
                Thread.Sleep(TimeSpan.FromSeconds(1));
            }

            if (participantStatus != ParticipantState.None)
            {
                participantStatus.Should().Be(expectedState);
            }
        }

        [Then(@"the participants statuses should update to (.*)")]
        public void ThenTheParticipantsStatusesShouldUpdateToDisconnected(string participantStatus)
        {
            _browsers[_tc.CurrentUser.Key].Driver.Navigate().Refresh();

            _browsers[_tc.CurrentUser.Key].Driver
                .WaitUntilVisible(
                    _hearingListPage.VideoHearingsOfficerSelectHearingButton(_tc.Hearing.Cases.First().Number))
                .Click();

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_adminPanelPage.ParticipantStatusTable).Displayed.Should().BeTrue();

            var participants = _scenario.Get<List<ParticipantDetailsResponse>>(ParticipantsKey);

            CheckParticipantStatus(participantStatus, participants);
        }

        private void CheckParticipantStatus(string participantStatus, IEnumerable<ParticipantDetailsResponse> participants)
        {
            foreach (var participant in participants)
            {
                var participantName = NameInCorrectFormat(participant);

                if (participant.Id != null)
                    _browsers[_tc.CurrentUser.Key].Driver
                        .WaitUntilVisible(
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
