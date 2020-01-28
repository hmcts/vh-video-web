﻿using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Api;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.AcceptanceTests.Strategies.ParticipantStatus;
using VideoWeb.Services.Video;
using UserRole = VideoWeb.Services.Video.UserRole;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class ParticipantStatusSteps
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _c;
        private readonly ScenarioContext _scenario;
        private const string ParticipantsKey = "participants";
        private const int MaxRetries = 5;

        public ParticipantStatusSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext,
            ScenarioContext scenario)
        {
            _c = testContext;
            _browsers = browsers;
            _scenario = scenario;
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
                participantStatuses[action].Execute(_c, participant.Id);
            }
        }

        [Then(@"the participants statuses should be (.*)")]
        public void ThenTheParticipantsStatusesShouldBeNotJoined(string participantStatus)
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(VhoHearingListPage.VideoHearingsOfficerSelectHearingButton(_c.Test.Case.Number)).Click();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(AdminPanelPage.ParticipantStatusTable, 60).Displayed.Should().BeTrue();
            var participants = _c.Test.Conference.Participants.FindAll(x => x.User_role == UserRole.Individual || x.User_role == UserRole.Representative);
            CheckParticipantStatus(participantStatus, participants);
            _scenario.Add(ParticipantsKey, participants);
        }

        [Then(@"the participant status will be updated to (.*)")]
        public void ThenTheParticipantStatusWillBeUpdatedToJoining(ParticipantState expectedState)
        {
            var participantState = new PollForParticipantStatus(_c.VideoWebConfig.VhServices.VideoApiUrl, _c.Tokens.VideoApiBearerToken)
                    .WithConferenceId(_c.Test.NewConferenceId)
                    .WithParticipant(_c.CurrentUser.Username)
                    .WithExpectedState(expectedState)
                    .Retries(MaxRetries)
                    .Poll();
            if (participantState != ParticipantState.None)
                participantState.Should().Be(expectedState);
        }

        [Then(@"the participants statuses should update to (.*)")]
        public void ThenTheParticipantsStatusesShouldUpdateToDisconnected(string participantStatus)
        {
            _browsers[_c.CurrentUser.Key].Driver.Navigate().Refresh();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(VhoHearingListPage.VideoHearingsOfficerSelectHearingButton(_c.Test.Case.Number)).Click();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(AdminPanelPage.ParticipantStatusTable, 60).Displayed.Should().BeTrue();
            var participants = _scenario.Get<List<ParticipantDetailsResponse>>(ParticipantsKey);
            CheckParticipantStatus(participantStatus, participants);
        }

        private void CheckParticipantStatus(string participantStatus, IEnumerable<ParticipantDetailsResponse> participants)
        {
            foreach (var participant in participants)
            {
                var participantName = NameInCorrectFormat(participant);
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(AdminPanelPage.ParticipantStatus(participant.Id, participantName)).Text.Trim().Should().Be(participantStatus);
            }
        }

        private static string NameInCorrectFormat(ParticipantDetailsResponse participant)
        {
            return $"{participant.Name} ({participant.Case_type_group})";
        }
    }
}
