using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using AcceptanceTests.Common.Data.Helpers;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Test.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Data;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.Services.TestApi;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class WaitingRoomSteps : ISteps
    {
        private const int ExtraTimeAfterReachingWaitingRoom = 3;
        private const int ExtraTimeInWaitingRoomAfterThePause = 10;
        private readonly Dictionary<User, UserBrowser> _browsers;
        private readonly TestContext _c;

        public WaitingRoomSteps(Dictionary<User, UserBrowser> browsers, TestContext testContext)
        {
            _browsers = browsers;
            _c = testContext;
        }

        [When(@"the user navigates back to the hearing list")]
        public void WhenTheUserNavigatesBackToTheHearingList()
        {
            _browsers[_c.CurrentUser].Click(JudgeWaitingRoomPage.ReturnToHearingRoomLink);
        }

        [When(@"the Judge resumes the hearing")]
        public void ThenTheUserResumesTheHearing()
        {
            Thread.Sleep(TimeSpan.FromSeconds(ExtraTimeInWaitingRoomAfterThePause));
            _browsers[_c.CurrentUser].Click(JudgeWaitingRoomPage.ResumeVideoCallButton);
        }

        [Then(@"the participant status for (.*) is displayed as (.*)")]
        public void ThenTheFirstParticipantStatusIsDisplayedAsNotSignedIn(string name, string status)
        {
            var user = Users.GetUserFromText(name, _c.Test.Users);
            var participant = _c.Test.ConferenceParticipants.First(x => x.Username.ToLower().Equals(user.Username.ToLower()));
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeParticipantPanel.ParticipantStatus(participant.Id)).Text.ToUpper().Trim().Should().Be(status.ToUpper());
        }

        [Then(@"the Judge can see information about their case")]
        [Then(@"the Judge can see information about their case")]
        public void ThenTheJudgeCanSeeInformationAboutTheirCase()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeWaitingRoomPage.ReturnToHearingRoomLink).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeWaitingRoomPage.ContactVho).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeWaitingRoomPage.HearingTitle).Text.Should().Be($"{_c.Test.Case.Name} ({_c.Test.Hearing.Case_type_name}) case number: {_c.Test.Hearing.Cases.First().Number}");
            
            var startDate = _c.TimeZone.Adjust(_c.Test.Hearing.Scheduled_date_time);
            var dateAndStartTime = startDate.ToString(DateFormats.JudgeWaitingRoomPageTime);
            var endTime = startDate.AddMinutes( _c.Test.Hearing.Scheduled_duration).ToString(DateFormats.JudgeWaitingRoomPageTimeEnd);
            var displayedTime = TextHelpers.RemoveSpacesOnSafari(_browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeWaitingRoomPage.HearingDateTime).Text);
            displayedTime.Should().Be($"{dateAndStartTime} to {endTime}");
            
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeWaitingRoomPage.StartHearingText).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeWaitingRoomPage.IsEveryoneConnectedText).Displayed.Should().BeTrue();
        }

        [Then(@"the participant can see information about their case")]
        public void ThenTheUserCanSeeInformationAboutTheirCase()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(WaitingRoomPage.HearingCaseDetails).Text.Should().Contain(_c.Test.Case.Name);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(WaitingRoomPage.HearingCaseDetails).Text.Should().Contain($"case number: {_c.Test.Hearing.Cases.First().Number}");
            
            var displayedDateTime = TextHelpers.RemoveSpacesOnSafari(_browsers[_c.CurrentUser].Driver.WaitUntilVisible(WaitingRoomPage.HearingDate).Text);
            displayedDateTime.Should().Contain(_c.TimeZone.Adjust(_c.Test.Hearing.Scheduled_date_time).ToString(DateFormats.WaitingRoomPageDate));
            displayedDateTime.Should().Contain(_c.TimeZone.Adjust(_c.Test.Hearing.Scheduled_date_time).ToString(DateFormats.WaitingRoomPageTime));
            
            var endTime = _c.TimeZone.Adjust(_c.Test.Hearing.Scheduled_date_time).AddMinutes(_c.Test.Hearing.Scheduled_duration).ToString(DateFormats.WaitingRoomPageTime);
            displayedDateTime.Should().Contain(endTime);
            
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(WaitingRoomPage.ContactVhTeam).Displayed.Should().BeTrue();
        }

        [Then(@"the Judge can see a list of participants and their representatives")]
        public void ThenTheJudgeCanSeeAListOfParticipantsAndTheirRepresentatives()
        {
            var panelMembers = _c.Test.ConferenceParticipants.FindAll(x => x.Last_name.ToLower().Contains("panelmember"));
            var individuals = _c.Test.ConferenceParticipants.FindAll(x => x.Last_name.ToLower().Contains("individual"));
            var representatives = _c.Test.ConferenceParticipants.FindAll(x => x.Last_name.ToLower().Contains("representative"));
            var observers = _c.Test.ConferenceParticipants.FindAll(x => x.Last_name.ToLower().Contains("observer"));

            (panelMembers.Count + individuals.Count + representatives.Count + observers.Count).Should().BeGreaterThan(0);

            foreach (var panelMember in panelMembers)
            {
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeParticipantPanel.PanelMemberName(panelMember.Id)).Text.Trim().Should().Be(panelMember.Name);
            }

            foreach (var individual in individuals)
            {
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeParticipantPanel.ParticipantName(individual.Id)).Text.Trim().Should().Be(individual.Name);
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeParticipantPanel.ParticipantHearingRole(individual.Id)).Text.Trim().Should().Be(individual.Hearing_role);
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeParticipantPanel.ParticipantCaseType(individual.Id)).Text.Trim().Should().Be(individual.Case_type_group);
            }

            foreach (var representative in representatives)
            {
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeParticipantPanel.ParticipantName(representative.Id)).Text.Trim().Should().Be(representative.Name);
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeParticipantPanel.ParticipantCaseType(representative.Id)).Text.Trim().Should().Be(representative.Case_type_group);
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeParticipantPanel.RepresentativeRepresentee(representative.Id)).Text.Trim().Should().Be($"Representative for {representative.Representee}");
            }

            foreach (var observer in observers)
            {
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeParticipantPanel.ObserverName(observer.Id)).Text.Trim().Should().Be(observer.Name);
            }
        }

        [Then(@"the participant can see a list of other participants and their representatives")]
        public void ThenTheParticipantCanSeeAListOfParticipantsAndTheirRepresentatives()
        {
            var panelMembers = _c.Test.ConferenceParticipants.FindAll(x => x.Last_name.ToLower().Contains("panelmember"));
            var individuals = _c.Test.ConferenceParticipants.FindAll(x => x.Last_name.ToLower().Contains("individual"));
            var representatives = _c.Test.ConferenceParticipants.FindAll(x => x.Last_name.ToLower().Contains("representative"));
            var observers = _c.Test.ConferenceParticipants.FindAll(x => x.Last_name.ToLower().Contains("observer"));

            (panelMembers.Count + individuals.Count + representatives.Count + observers.Count).Should().BeGreaterThan(0);

            foreach (var panelMember in panelMembers)
            {
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(ParticipantListPanel.PanelMemberName(panelMember.Id)).Text.Trim().Should().Be(panelMember.Name);
            }

            foreach (var individual in individuals)
            {
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(ParticipantListPanel.ParticipantName(individual.Id)).Text.Trim().Should().Be(individual.Name);
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(ParticipantListPanel.ParticipantHearingRole(individual.Id)).Text.Trim().Should().Be(individual.Hearing_role);
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(ParticipantListPanel.ParticipantCaseTypeGroup(individual.Id)).Text.Trim().Should().Be(individual.Case_type_group);
            }

            foreach (var representative in representatives)
            {
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(ParticipantListPanel.ParticipantName(representative.Id)).Text.Trim().Should().Be(representative.Name);
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(ParticipantListPanel.ParticipantHearingRole(representative.Id)).Text.Trim().Should().Be(representative.Hearing_role);
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(ParticipantListPanel.ParticipantCaseTypeGroup(representative.Id)).Text.Trim().Should().Be(representative.Case_type_group);
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(ParticipantListPanel.RepresentativeRepresentee(representative.Id)).Text.Trim().Should().Be(representative.Representee);
            }

            foreach (var observer in observers)
            {
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(ParticipantListPanel.ObserverName(observer.Id)).Text.Trim().Should().Be(observer.Name);
            }
        }

        [Then(@"the Judge can see other participants status")]
        public void ThenTheUserCanSeeOtherParticipantsStatus()
        {
            var participants = _c.Test.ConferenceParticipants.Where(participant =>
                participant.User_role == UserRole.Individual ||
                participant.User_role == UserRole.Representative);
            foreach (var participant in participants)
            {
                _browsers[_c.CurrentUser].Driver
                    .WaitUntilVisible(JudgeParticipantPanel.ParticipantStatus(participant.Id)).Text.Trim().ToUpperInvariant().Should()
                    .BeEquivalentTo("Not signed in".ToUpperInvariant());
            }
        }

        [Then(@"the user can see the hearing is (.*) title")]
        public void ThenTheUserCanSeeTheHearingIsAAboutToBeginTitle(string title)
        {
            var headerElement = title.Equals("delayed") ? WaitingRoomPage.DelayedHeader : WaitingRoomPage.ScheduledHeader;
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(headerElement).Displayed.Should().BeTrue();
        }

        private string GetTheTimePanelColour()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(WaitingRoomPage.TimePanel);
            _browsers[_c.CurrentUser].ScrollTo(WaitingRoomPage.TimePanel);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(WaitingRoomPage.TimePanel).Displayed.Should().BeTrue();
            var rgba = _browsers[_c.CurrentUser].Driver.WaitUntilElementExists(WaitingRoomPage.TimePanel).GetCssValue("background-color");
            return CustomConverters.ConvertRgbToHex(rgba);
        }

        [Then(@"the user can see a yellow box and a delayed message")]
        public void ThenTheUserCanSeeAYellowBox()
        {
            var actualColour = GetTheTimePanelColour();
            actualColour.Should().Be(WaitingRoomPage.DelayedBgColour);
            _browsers[_c.CurrentUser].Driver.WaitUntilElementExists(WaitingRoomPage.DelayedText).Displayed.Should().BeTrue();
        }

        [Then(@"the user can see a blue box and a scheduled message")]
        public void ThenTheUserCanSeeABlueBox()
        {
            var actualColour = GetTheTimePanelColour();
            actualColour.Should().Be(WaitingRoomPage.ScheduledBgColour);
            _browsers[_c.CurrentUser].Driver.WaitUntilElementExists(WaitingRoomPage.ScheduledText).Displayed.Should().BeTrue();
        }

        [Then(@"the user can see a black box and an about to begin message")]
        public void ThenTheUserCanSeeABlackBox()
        {
            var actualColour = GetTheTimePanelColour();
            actualColour.Should().Be(WaitingRoomPage.AboutToBeginBgColour);
            _browsers[_c.CurrentUser].Driver.WaitUntilElementExists(WaitingRoomPage.AboutToBeginText).Displayed.Should().BeTrue();
        }

        [Then(@"the Judge waiting room displays the paused status")]
        public void ThenTheJudgeWaitingRoomDisplaysThePausedStatus()
        {
            _browsers[_c.CurrentUser].Driver.SwitchTo().DefaultContent();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeWaitingRoomPage.PausedText).Displayed.Should().BeTrue();
        }

        [Then(@"the participants waiting room displays the paused status")]
        public void ThenTheWaitingRoomDisplaysThePausedStatus()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(WaitingRoomPage.PausedTitle).Displayed.Should().BeTrue();
        }

        [Then(@"the participants waiting room displays the closed status")]
        public void ThenTheWaitingRoomDisplaysTheClosedStatus()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(WaitingRoomPage.ClosedTitle).Displayed.Should().BeTrue();
        }

        [When(@"the Judge starts the hearing")]
        public void ProgressToNextPage()
        {
            Thread.Sleep(TimeSpan.FromSeconds(ExtraTimeAfterReachingWaitingRoom));
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeWaitingRoomPage.StartVideoHearingButton).Displayed.Should().BeTrue();
            CheckParticipantsAreStillConnected();
            _browsers[_c.CurrentUser].Click(JudgeWaitingRoomPage.StartVideoHearingButton);
        }

        [When(@"the waiting room page has loaded for the (.*)")]
        public void WhenTheWaitingRoomPageHasLoadedForTheUser(string user)
        {
            if (user.ToLower().Equals("judge"))
            {
                ThenTheJudgeCanSeeInformationAboutTheirCase();
            }
            else
            {
                ThenTheUserCanSeeInformationAboutTheirCase();
            }
        }

        private void CheckParticipantsAreStillConnected()
        {
            var loggedInParticipants = LoggedInParticipants(_browsers.Keys, _c.Test.ConferenceParticipants);
            foreach (var user in loggedInParticipants)
            {
                if ((user.User_role == UserRole.Judge)) continue;
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeParticipantPanel.ParticipantStatus(user.Id));
                _browsers[_c.CurrentUser].ScrollTo(JudgeParticipantPanel.ParticipantStatus(user.Id));
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(JudgeParticipantPanel.ParticipantStatus(user.Id)).Text.ToUpper().Trim()
                    .Should().Be("CONNECTED");
            }
        }

        private static IEnumerable<ParticipantDetailsResponse> LoggedInParticipants(Dictionary<User, UserBrowser>.KeyCollection browsersKeys, IReadOnlyCollection<ParticipantDetailsResponse> allParticipants)
        {
            var participants = (from user in browsersKeys where allParticipants.Any(x => x.Name.ToLower().Contains(user.Last_name.ToLower())) select allParticipants.First(x => x.Name.ToLower().Contains(user.Last_name.ToLower()))).ToList();
            participants.Should().NotBeNullOrEmpty();
            return participants;
        }
    }
}
