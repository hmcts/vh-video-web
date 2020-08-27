using System;
using System.Collections.Generic;
using System.Threading;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Api;
using VideoWeb.AcceptanceTests.Data;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.AcceptanceTests.Strategies.ParticipantStatus;
using VideoWeb.Services.TestApi;
using ParticipantDetailsResponse = VideoWeb.Services.Video.ParticipantDetailsResponse;
using ParticipantState = VideoWeb.Services.Video.ParticipantState;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class ParticipantStatusSteps
    {
        private readonly Dictionary<User, UserBrowser> _browsers;
        private readonly TestContext _c;
        private const int MaxRetries = 30;

        public ParticipantStatusSteps(Dictionary<User, UserBrowser> browsers, TestContext testContext)
        {
            _c = testContext;
            _browsers = browsers;
        }

        [Given(@"the (.*) status is (.*)")]
        [When(@"the (.*) statuses are (.*)")]
        [When(@"the (.*) status is (.*)")]
        public void WhenTheParticipantsStatusesChange(string userType, string action)
        {
            var statuses = new Dictionary<string, IParticipantStatusStrategy>
            {
                {"Available", new AvailableStrategy()},
                {"Disconnected", new DisconnectedStrategy()},
                {"In consultation", new InConsultationStrategy()},
                {"In hearing", new InHearingStrategy()},
                {"Joining", new JoiningStrategy()}
            };
            var participants = ParticipantsManager.GetParticipantsFromRole(_c.Test.ConferenceParticipants, userType);
            foreach (var participant in participants)
            {
                statuses[action].Execute(_c, participant.Id);
            }
        }

        [Then(@"the VHO can see the (.*) status is (.*)")]
        [Then(@"the VHO can see the (.*) statuses are (.*)")]
        public void ThenTheParticipantsStatusesAre(string userType, string participantStatus)
        {
            Scrolling.ScrollToTheHearing(_browsers[_c.CurrentUser], _c.Test.Conference.Id);
            _browsers[_c.CurrentUser].Click(VhoHearingListPage.SelectHearingButton(_c.Test.Conference.Id));
            Scrolling.ScrollToTheTopOfThePage(_browsers[_c.CurrentUser]);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AdminPanelPage.ParticipantStatusTable, 60).Displayed.Should().BeTrue();
            CheckParticipantStatus(participantStatus, ParticipantsManager.GetParticipantsFromRole(_c.Test.ConferenceParticipants, userType));
        }

        [Then(@"the VHO can see the status of participant (.*) is (.*)")]
        public void ThenTheParticipantStatusIs(string user, string participantStatus)
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AdminPanelPage.ParticipantStatusTable, 60).Displayed.Should().BeTrue();
            CheckParticipantStatus(participantStatus, ParticipantsManager.GetParticipantFromLastname(_c.Test.ConferenceParticipants, user));
        }

        [Then(@"the users status has updated to (.*)")]
        public void ThenTheParticipantStatusWillBeUpdatedTo(ParticipantState expectedState)
        {
            var participantState = new PollForParticipantStatus(_c.Apis.TestApi)
                    .WithConferenceId(_c.Test.NewConferenceId)
                    .WithParticipant(_c.CurrentUser.Username)
                    .WithExpectedState(expectedState)
                    .Retries(MaxRetries)
                    .Poll();
            if (participantState != ParticipantState.None)
                participantState.Should().Be(expectedState);
        }

        [Then(@"the VHO can see the (.*) status has updated to (.*)")]
        [Then(@"the VHO can see the (.*) statuses have updated to (.*)")]
        public void ThenTheParticipantsStatusesShouldUpdateTo(string userType, string expectedStatus)
        {
            _browsers[_c.CurrentUser].Refresh();
            Scrolling.ScrollToTheHearing(_browsers[_c.CurrentUser], _c.Test.Conference.Id);
            _browsers[_c.CurrentUser].Click(VhoHearingListPage.SelectHearingButton(_c.Test.Conference.Id));
            Scrolling.ScrollToTheTopOfThePage(_browsers[_c.CurrentUser]);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AdminPanelPage.ParticipantStatusTable, 60).Displayed.Should().BeTrue();
            var participants = ParticipantsManager.GetParticipantsFromRole(_c.Test.ConferenceParticipants, userType);
            CheckParticipantStatus(expectedStatus, participants);
        }

        private void CheckParticipantStatus(string expectedStatus, IEnumerable<ParticipantDetailsResponse> participants)
        {
            foreach (var participant in participants)
            {
                PollForStatusUpdate(participant, expectedStatus).Should().Be(expectedStatus);
            }
        }

        private string PollForStatusUpdate(ParticipantDetailsResponse participant, string expectedStatus)
        {
            for (var i = 0; i < MaxRetries; i++)
            {
                var status = _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AdminPanelPage.ParticipantStatus(participant.Id)).Text.Trim();
                if (status.Equals(expectedStatus))
                {
                    return status;
                }
                Thread.Sleep(TimeSpan.FromSeconds(1));
            }
            throw new TimeoutException($"Expected participant status to be updated to {expectedStatus}");
        }
    }
}
