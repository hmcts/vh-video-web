using System;
using System.Collections.Generic;
using System.Linq;
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
using TestApi.Contract.Dtos;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class ParticipantStatusSteps
    {
        private readonly Dictionary<UserDto, UserBrowser> _browsers;
        private readonly TestContext _c;
        private const int MaxRetries = 30;

        public ParticipantStatusSteps(Dictionary<UserDto, UserBrowser> browsers, TestContext testContext)
        {
            _c = testContext;
            _browsers = browsers;
        }

        [Given(@"the (.*) (?:status|statuses) is set to (.*)")]
        [When(@"the (.*) (?:status|statuses) (?:change|changes) to (.*)")]
        public void WhenTheParticipantsStatusesChange(string text, string action)
        {
            var statuses = new Dictionary<string, IParticipantStatusStrategy>
            {
                {"Available", new AvailableStrategy()},
                {"Disconnected", new DisconnectedStrategy()},
                {"In consultation", new InConsultationStrategy()},
                {"In hearing", new InHearingStrategy()},
                {"Joining", new JoiningStrategy()}
            };
            var participants = text.Equals("participants") ? _c.Test.ConferenceParticipants.Where(x => x.UserRole != UserRole.Judge) : ParticipantsManager.GetParticipantsFromRole(_c.Test.ConferenceParticipants, text);
            foreach (var participant in participants)
            {
                statuses[action].Execute(_c, participant.Id);
            }
        }

        [Given(@"the VHO can see the (.*) (?:status|statuses) (?:is|are) (.*)")]
        [Then(@"the VHO can see the (.*) (?:status|statuses) (?:is|are) (.*)")]
        public void ThenTheParticipantsStatusesAre(string text, string participantStatus)
        {
            Scrolling.ScrollToTheHearing(_browsers[_c.CurrentUser], _c.Test.Conference.Id);
            _browsers[_c.CurrentUser].Click(VhoHearingListPage.SelectHearingButton(_c.Test.Conference.Id));
            Scrolling.ScrollToTheTopOfThePage(_browsers[_c.CurrentUser]);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AdminPanelPage.ParticipantStatusTable, 60).Displayed.Should().BeTrue();
            var participants = text.Equals("participants") ? _c.Test.ConferenceParticipants.Where(x => x.UserRole != UserRole.Judge) : ParticipantsManager.GetParticipantsFromRole(_c.Test.ConferenceParticipants, text);
            CheckParticipantStatus(participantStatus, participants);
        }

        [Then(@"the VHO can see the status of participant (.*) is (.*)")]
        public void ThenTheParticipantStatusIs(string user, string expectedStatus)
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AdminPanelPage.ParticipantStatusTable, 60).Displayed.Should().BeTrue();
            CheckParticipantStatus(expectedStatus, GetParticipants(user));
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

        [Then(@"the VHO can see the (.*) (?:status|statuses) (?:has|have) updated to (.*)")]
        public void ThenTheParticipantsStatusesShouldUpdateTo(string text, string expectedStatus)
        {
            _browsers[_c.CurrentUser].Refresh();
            Scrolling.ScrollToTheHearing(_browsers[_c.CurrentUser], _c.Test.Conference.Id);
            _browsers[_c.CurrentUser].Click(VhoHearingListPage.SelectHearingButton(_c.Test.Conference.Id));
            Scrolling.ScrollToTheTopOfThePage(_browsers[_c.CurrentUser]);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AdminPanelPage.ParticipantStatusTable, 60).Displayed.Should().BeTrue();
            var participants = text.Equals("participants") ? _c.Test.ConferenceParticipants.Where(x => x.UserRole != UserRole.Judge) : ParticipantsManager.GetParticipantsFromRole(_c.Test.ConferenceParticipants, text);
            CheckParticipantStatus(expectedStatus, participants);
        }

        private IEnumerable<ParticipantDetailsResponse> GetParticipants(string text)
        {
            var user = Users.GetUserFromText(text, _c.Test.Users);
            var participant = _c.Test.ConferenceParticipants.First(x => x.Username.Equals(user.Username));
            return new List<ParticipantDetailsResponse>() {participant};
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
