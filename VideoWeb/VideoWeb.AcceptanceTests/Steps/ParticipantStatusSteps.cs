using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Api;
using VideoWeb.AcceptanceTests.Data;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.AcceptanceTests.Strategies.ParticipantStatus;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class ParticipantStatusSteps
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _c;
        private const int MaxRetries = 30;

        public ParticipantStatusSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext)
        {
            _c = testContext;
            _browsers = browsers;
        }

        [When(@"the (.*) are (.*)")]
        [When(@"the (.*) is (.*)")]
        public void WhenTheParticipantsStatusesChange(string userType, string action)
        {
            var statuses = new Dictionary<string, IParticipantStatusStrategy>
            {
                {"Available", new AvailableStrategy()},
                {"Disconnected", new DisconnectedStrategy()},
                {"In Consultation", new InConsultationStrategy()},
                {"In Hearing", new InHearingStrategy()},
                {"Joining", new JoiningStrategy()}
            };
            var participants = ParticipantsManager.GetParticipantsFromRole(_c.Test.ConferenceParticipants, userType);
            foreach (var participant in participants)
            {
                statuses[action].Execute(_c, participant.Id);
            }
        }

        [Then(@"the (.*) status should be (.*)")]
        [Then(@"the (.*) statuses should be (.*)")]
        public void ThenTheParticipantsStatusesShouldBeNotJoined(string userType, string participantStatus)
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(VhoHearingListPage.VideoHearingsOfficerSelectHearingButton(_c.Test.Case.Number)).Click();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(AdminPanelPage.ParticipantStatusTable, 60).Displayed.Should().BeTrue();
            CheckParticipantStatus(participantStatus, ParticipantsManager.GetParticipantsFromRole(_c.Test.ConferenceParticipants, userType));
        }

        [Then(@"the participants status will be updated to (.*)")]
        public void ThenTheParticipantStatusWillBeUpdatedToJoining(ParticipantState expectedState)
        {
            var participantState = new PollForParticipantStatus(_c.Apis.VideoApi)
                    .WithConferenceId(_c.Test.NewConferenceId)
                    .WithParticipant(_c.CurrentUser.Username)
                    .WithExpectedState(expectedState)
                    .Retries(MaxRetries)
                    .Poll();
            if (participantState != ParticipantState.None)
                participantState.Should().Be(expectedState);
        }

        [Then(@"the (.*) status should update to (.*)")]
        [Then(@"the (.*) statuses should update to (.*)")]
        public void ThenTheParticipantsStatusesShouldUpdateToDisconnected(string userType, string participantStatus)
        {
            _browsers[_c.CurrentUser.Key].Driver.Navigate().Refresh();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(VhoHearingListPage.VideoHearingsOfficerSelectHearingButton(_c.Test.Case.Number)).Click();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(AdminPanelPage.ParticipantStatusTable, 60).Displayed.Should().BeTrue();
            var participants = ParticipantsManager.GetParticipantsFromRole(_c.Test.ConferenceParticipants, userType);
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
