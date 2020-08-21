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
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class WaitingRoomSteps : ISteps
    {
        private const int ExtraTimeAfterReachingWaitingRoom = 3;
        private const int ExtraTimeInWaitingRoomAfterThePause = 10;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _c;

        public WaitingRoomSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext)
        {
            _browsers = browsers;
            _c = testContext;
        }

        [When(@"the user navigates back to the hearing list")]
        public void WhenTheUserNavigatesBackToTheHearingList()
        {
            _browsers[_c.CurrentUser.Key].Click(ClerkWaitingRoomPage.ReturnToHearingRoomLink);
        }

        [When(@"the Clerk resumes the hearing")]
        public void ThenTheUserResumesTheHearing()
        {
            Thread.Sleep(TimeSpan.FromSeconds(ExtraTimeInWaitingRoomAfterThePause));
            _browsers[_c.CurrentUser.Key].Click(ClerkWaitingRoomPage.ResumeVideoCallButton);
        }

        [Then(@"the participant status for (.*) is displayed as (.*)")]
        public void ThenTheFirstParticipantStatusIsDisplayedAsNotSignedIn(string name, string status)
        {
            var participant = _c.Test.ConferenceParticipants.First(x => x.Name.Contains(name));
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(JudgeParticipantPanel.ParticipantStatus(participant.Id)).Text.ToUpper().Trim().Should().Be(status.ToUpper());
        }

        [Then(@"the Clerk can see information about their case")]
        [Then(@"the Judge can see information about their case")]
        public void ThenTheClerkCanSeeInformationAboutTheirCase()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkWaitingRoomPage.ReturnToHearingRoomLink).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkWaitingRoomPage.ContactVho).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkWaitingRoomPage.HearingTitle).Text.Should().Be($"{_c.Test.Case.Name} ({_c.Test.Hearing.Case_type_name}) case number: {_c.Test.Hearing.Cases.First().Number}");
            
            var startDate = _c.TimeZone.Adjust(_c.Test.Hearing.Scheduled_date_time);
            var dateAndStartTime = startDate.ToString(DateFormats.ClerkWaitingRoomPageTime);
            var endTime = startDate.AddMinutes( _c.Test.Hearing.Scheduled_duration).ToString(DateFormats.ClerkWaitingRoomPageTimeEnd);
            var displayedTime = TextHelpers.RemoveSpacesOnSafari(_browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkWaitingRoomPage.HearingDateTime).Text);
            displayedTime.Should().Be($"{dateAndStartTime} to {endTime}");
            
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkWaitingRoomPage.StartHearingText).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkWaitingRoomPage.IsEveryoneConnectedText).Displayed.Should().BeTrue();
        }

        [Then(@"the participant can see information about their case")]
        public void ThenTheUserCanSeeInformationAboutTheirCase()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(WaitingRoomPage.HearingCaseDetails).Text.Should().Contain(_c.Test.Case.Name);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(WaitingRoomPage.HearingCaseDetails).Text.Should().Contain($"case number: {_c.Test.Hearing.Cases.First().Number}");
            
            var displayedDateTime = TextHelpers.RemoveSpacesOnSafari(_browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(WaitingRoomPage.HearingDate).Text);
            displayedDateTime.Should().Contain(_c.TimeZone.Adjust(_c.Test.Hearing.Scheduled_date_time).ToString(DateFormats.WaitingRoomPageDate));
            displayedDateTime.Should().Contain(_c.TimeZone.Adjust(_c.Test.Hearing.Scheduled_date_time).ToString(DateFormats.WaitingRoomPageTime));
            
            var endTime = _c.TimeZone.Adjust(_c.Test.Hearing.Scheduled_date_time).AddMinutes(_c.Test.Hearing.Scheduled_duration).ToString(DateFormats.WaitingRoomPageTime);
            displayedDateTime.Should().Contain(endTime);
            
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(WaitingRoomPage.ContactVhTeam).Displayed.Should().BeTrue();
        }

        [Then(@"the Clerk can see a list of participants and their representatives")]
        public void ThenTheClerkCanSeeAListOfParticipantsAndTheirRepresentatives()
        {
            var panelMembers = _c.Test.ConferenceParticipants.FindAll(x => x.Last_name.ToLower().Contains("panelmember"));
            var individuals = _c.Test.ConferenceParticipants.FindAll(x => x.Last_name.ToLower().Contains("individual"));
            var representatives = _c.Test.ConferenceParticipants.FindAll(x => x.Last_name.ToLower().Contains("representative"));
            var observers = _c.Test.ConferenceParticipants.FindAll(x => x.Last_name.ToLower().Contains("observer"));

            (panelMembers.Count + individuals.Count + representatives.Count + observers.Count).Should().BeGreaterThan(0);

            foreach (var panelMember in panelMembers)
            {
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(JudgeParticipantPanel.PanelMemberName(panelMember.Id)).Text.Trim().Should().Be(panelMember.Name);
            }

            foreach (var individual in individuals)
            {
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(JudgeParticipantPanel.ParticipantName(individual.Id)).Text.Trim().Should().Be(individual.Name);
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(JudgeParticipantPanel.ParticipantCaseType(individual.Id)).Text.Trim().Should().Be(individual.Case_type_group);
            }

            foreach (var representative in representatives)
            {
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(JudgeParticipantPanel.ParticipantName(representative.Id)).Text.Trim().Should().Be(representative.Name);
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(JudgeParticipantPanel.ParticipantCaseType(representative.Id)).Text.Trim().Should().Be(representative.Case_type_group);
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(JudgeParticipantPanel.RepresentativeRepresentee(representative.Id)).Text.Trim().Should().Be($"Representing {representative.Representee}");
            }

            foreach (var observer in observers)
            {
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(JudgeParticipantPanel.ObserverName(observer.Id)).Text.Trim().Should().Be(observer.Name);
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
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ParticipantListPanel.PanelMemberName(panelMember.Id)).Text.Trim().Should().Be(panelMember.Name);
            }

            foreach (var individual in individuals)
            {
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ParticipantListPanel.ParticipantName(individual.Id)).Text.Trim().Should().Be(individual.Name);
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ParticipantListPanel.ParticipantCaseTypeGroup(individual.Id)).Text.Trim().Should().Be(individual.Case_type_group);
            }

            foreach (var representative in representatives)
            {
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ParticipantListPanel.ParticipantName(representative.Id)).Text.Trim().Should().Be(representative.Name);
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ParticipantListPanel.ParticipantCaseTypeGroup(representative.Id)).Text.Trim().Should().Be(representative.Case_type_group);
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ParticipantListPanel.RepresentativeRepresentee(representative.Id)).Text.Trim().Should().Be(representative.Representee);
            }

            foreach (var observer in observers)
            {
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ParticipantListPanel.ObserverName(observer.Id)).Text.Trim().Should().Be(observer.Name);
            }
        }

        [Then(@"the Clerk can see other participants status")]
        public void ThenTheUserCanSeeOtherParticipantsStatus()
        {
            var participants = _c.Test.ConferenceParticipants.Where(participant =>
                participant.User_role == UserRole.Individual ||
                participant.User_role == UserRole.Representative);
            foreach (var participant in participants)
            {
                _browsers[_c.CurrentUser.Key].Driver
                    .WaitUntilVisible(JudgeParticipantPanel.ParticipantStatus(participant.Id)).Text.Trim().ToUpperInvariant().Should()
                    .BeEquivalentTo("Not signed in".ToUpperInvariant());
            }
        }

        [Then(@"the user can see the hearing is (.*) title")]
        public void ThenTheUserCanSeeTheHearingIsAAboutToBeginTitle(string title)
        {
            var headerElement = title.Equals("delayed") ? WaitingRoomPage.DelayedHeader : WaitingRoomPage.ScheduledHeader;
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(headerElement).Displayed.Should().BeTrue();
        }

        private string GetTheTimePanelColour()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(WaitingRoomPage.TimePanel);
            _browsers[_c.CurrentUser.Key].ScrollTo(WaitingRoomPage.TimePanel);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(WaitingRoomPage.TimePanel).Displayed.Should().BeTrue();
            var rgba = _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementExists(WaitingRoomPage.TimePanel).GetCssValue("background-color");
            return CustomConverters.ConvertRgbToHex(rgba);
        }

        [Then(@"the user can see a yellow box and a delayed message")]
        public void ThenTheUserCanSeeAYellowBox()
        {
            var actualColour = GetTheTimePanelColour();
            actualColour.Should().Be(WaitingRoomPage.DelayedBgColour);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementExists(WaitingRoomPage.DelayedText).Displayed.Should().BeTrue();
        }

        [Then(@"the user can see a blue box and a scheduled message")]
        public void ThenTheUserCanSeeABlueBox()
        {
            var actualColour = GetTheTimePanelColour();
            actualColour.Should().Be(WaitingRoomPage.ScheduledBgColour);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementExists(WaitingRoomPage.ScheduledText).Displayed.Should().BeTrue();
        }

        [Then(@"the user can see a black box and an about to begin message")]
        public void ThenTheUserCanSeeABlackBox()
        {
            var actualColour = GetTheTimePanelColour();
            actualColour.Should().Be(WaitingRoomPage.AboutToBeginBgColour);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementExists(WaitingRoomPage.AboutToBeginText).Displayed.Should().BeTrue();
        }

        [Then(@"the Clerk waiting room displays the paused status")]
        public void ThenTheClerkWaitingRoomDisplaysThePausedStatus()
        {
            _browsers[_c.CurrentUser.Key].Driver.SwitchTo().DefaultContent();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkWaitingRoomPage.PausedText).Displayed.Should().BeTrue();
        }

        [Then(@"the participants waiting room displays the paused status")]
        public void ThenTheWaitingRoomDisplaysThePausedStatus()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(WaitingRoomPage.PausedTitle).Displayed.Should().BeTrue();
        }

        [Then(@"the participants waiting room displays the closed status")]
        public void ThenTheWaitingRoomDisplaysTheClosedStatus()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(WaitingRoomPage.ClosedTitle).Displayed.Should().BeTrue();
        }

        [When(@"the Clerk starts the hearing")]
        public void ProgressToNextPage()
        {
            Thread.Sleep(TimeSpan.FromSeconds(ExtraTimeAfterReachingWaitingRoom));
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkWaitingRoomPage.StartVideoHearingButton).Displayed.Should().BeTrue();
            CheckParticipantsAreStillConnected();
            _browsers[_c.CurrentUser.Key].Click(ClerkWaitingRoomPage.StartVideoHearingButton);
        }

        [When(@"the waiting room page has loaded for the (.*)")]
        public void WhenTheWaitingRoomPageHasLoadedForTheUser(string user)
        {
            if (user.ToLower().Equals("clerk"))
            {
                ThenTheClerkCanSeeInformationAboutTheirCase();
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
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(JudgeParticipantPanel.ParticipantStatus(user.Id));
                _browsers[_c.CurrentUser.Key].ScrollTo(JudgeParticipantPanel.ParticipantStatus(user.Id));
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(JudgeParticipantPanel.ParticipantStatus(user.Id)).Text.ToUpper().Trim()
                    .Should().Be("CONNECTED");
            }
        }

        private static IEnumerable<ParticipantDetailsResponse> LoggedInParticipants(Dictionary<string, UserBrowser>.KeyCollection browsersKeys, IReadOnlyCollection<ParticipantDetailsResponse> allParticipants)
        {
            var participants = (from user in browsersKeys where allParticipants.Any(x => x.Name.ToLower().Contains(user.ToLower())) select allParticipants.First(x => x.Name.ToLower().Contains(user.ToLower()))).ToList();
            participants.Should().NotBeNullOrEmpty();
            return participants;
        }
    }
}
