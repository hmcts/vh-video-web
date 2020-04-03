using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using AcceptanceTests.Common.Data.Helpers;
using AcceptanceTests.Common.Driver.Browser;
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
        private const int ExtraTimeInWaitingRoomAfterThePause = 10;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _c;
        private readonly BrowserSteps _browserSteps;

        public WaitingRoomSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext, BrowserSteps browserSteps)
        {
            _browsers = browsers;
            _c = testContext;
            _browserSteps = browserSteps;
        }

        [Given(@"all the participants refresh their browsers")]
        public void GivenAllTheParticipantsRefreshTheirBrowsers()
        {
            var participants = _c.Test.HearingParticipants.Where(x => !x.Display_name.ToLower().Contains("clerk"));
            foreach (var participant in participants)
            {
                _browserSteps.GivenInTheUsersBrowser(participant.Last_name);
                _browsers[_c.CurrentUser.Key].Refresh();
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(WaitingRoomPage.HearingCaseDetails, 60).Text.Should().Contain(_c.Test.Case.Name);
            }
            _browserSteps.GivenInTheUsersBrowser("Clerk");
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
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkWaitingRoomPage.ParticipantStatus(participant.Id)).Text.ToUpper().Trim().Should().Be(status.ToUpper());
        }

        [Then(@"the Clerk can see information about their case")]
        [Then(@"the Judge can see information about their case")]
        public void ThenTheClerkCanSeeInformationAboutTheirCase()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkWaitingRoomPage.ReturnToHearingRoomLink).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkWaitingRoomPage.ContactVho).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkWaitingRoomPage.HearingTitle).Text.Should().Be($"{_c.Test.Case.Name} ({_c.Test.Hearing.Case_type_name}) case number: {_c.Test.Hearing.Cases.First().Number}");
            var startDate = _c.Test.Hearing.Scheduled_date_time;
            var dateAndStartTime = startDate.ToLocalTime().ToString(DateFormats.ClerkWaitingRoomPageTime);
            var endTime = startDate.ToLocalTime().AddMinutes( _c.Test.Hearing.Scheduled_duration).ToString(DateFormats.ClerkWaitingRoomPageTimeEnd);
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
            displayedDateTime.Should().Contain(_c.Test.Hearing.Scheduled_date_time.ToString(DateFormats.WaitingRoomPageDate));
            displayedDateTime.Should().Contain(_c.Test.Hearing.Scheduled_date_time.ToLocalTime().ToString(DateFormats.WaitingRoomPageTime));
            var endTime = _c.Test.Hearing.Scheduled_date_time.AddMinutes(_c.Test.Hearing.Scheduled_duration).ToLocalTime().ToString(DateFormats.WaitingRoomPageTime);
            displayedDateTime.Should().Contain(endTime);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(WaitingRoomPage.ContactVhTeam).Displayed.Should().BeTrue();
        }

        [Then(@"the user can see a list of participants and their representatives")]
        public void ThenTheUserCanSeeAListOfParticipantsAndTheirRepresentatives()
        {
            var rowsElement = _c.CurrentUser.Role.ToLower().Equals("individual") ? WaitingRoomPage.IndividualParticipantsList : WaitingRoomPage.ParticipantsList;
            var allRows = _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementsVisible(rowsElement);
            var participantRowIds = (from row in allRows where row.GetAttribute("id") != "" select row.GetAttribute("id")).ToList();
            var participantsInformation = (from id in participantRowIds select _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementsVisible(WaitingRoomPage.RowInformation(id)) into infoRows where infoRows.Count > 0 select new ParticipantInformation {CaseTypeGroup = infoRows[0].Text, Name = infoRows[1].Text, Representee = infoRows.Count.Equals(3) ? infoRows[2].Text : null}).ToList();

            foreach (var participant in _c.Test.ConferenceParticipants)
            {
                if (!participant.User_role.Equals(UserRole.Individual) &&
                    !participant.User_role.Equals(UserRole.Representative)) continue;
                foreach (var row in participantsInformation.Where(row => row.Name.Equals(participant.Name)))
                {
                    row.CaseTypeGroup.Should().Be(participant.Case_type_group);
                    if (participant.Representee != string.Empty)
                    {
                        row.Representee.Should().Be($"Representing {participant.Representee}");
                    }
                }
            }
        }

        [Then(@"the user can see other participants status")]
        public void ThenTheUserCanSeeOtherParticipantsStatus()
        {
            foreach (var participant in _c.Test.ConferenceParticipants.Where(participant => participant.User_role == UserRole.Individual ||
                                                                                            participant.User_role == UserRole.Representative))
            {
                _browsers[_c.CurrentUser.Key].Driver
                    .WaitUntilVisible(WaitingRoomPage.OtherParticipantsStatus(participant.Id)).Text.Should()
                    .BeEquivalentTo("Unavailable");
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
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkWaitingRoomPage.StartHearingText).Displayed.Should().BeTrue();
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
            foreach (var user in _browsers.Keys.Select(lastname => _c.Test.ConferenceParticipants.First(x => x.Name.ToLower().Contains(lastname.ToLower()))).Where(user => !user.User_role.Equals(UserRole.Judge)))
            {
                _browsers[_c.CurrentUser.Key].ScrollTo(ClerkWaitingRoomPage.ParticipantStatus(user.Id));
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkWaitingRoomPage.ParticipantStatus(user.Id)).Text.ToUpper().Trim()
                    .Should().Be("AVAILABLE");
            }
        }
    }
}
