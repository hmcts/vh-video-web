using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Threading;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using OpenQA.Selenium.Support.Extensions;
using TechTalk.SpecFlow;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class WaitingRoomSteps : ISteps
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _c;
        private readonly BrowserSteps _browserSteps;
        private const int ExtraTimeInWaitingRoomAfterThePause = 10;

        public WaitingRoomSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext, BrowserSteps browserSteps)
        {
            _browsers = browsers;
            _c = testContext;
            _browserSteps = browserSteps;
        }

        [Given(@"all the participants refresh their browsers")]
        public void GivenAllTheParticipantsRefreshTheirBrowsers()
        {
            var participants = _c.Hearing.Participants.Where(x => !x.Display_name.ToLower().Contains("clerk"));
            foreach (var participant in participants)
            {
                _browserSteps.GivenInTheUsersBrowser(participant.Last_name);
                _browsers[_c.CurrentUser.Key].Driver.Navigate().Refresh();
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(WaitingRoomPage.HearingCaseDetails, 60).Text
                    .Should().Contain(_c.Hearing.Cases.First().Name);
            }
            _browserSteps.GivenInTheUsersBrowser("Clerk");
        }

        [When(@"the user navigates back to the hearing list")]
        public void WhenTheUserNavigatesBackToTheHearingList()
        {
            _browsers[_c.CurrentUser.Key].Driver.ClickAndWaitForPageToLoad(ClerkWaitingRoomPage.ReturnToHearingRoomLink);
        }

        [When(@"the Clerk resumes the hearing")]
        public void ThenTheUserResumesTheHearing()
        {
            Thread.Sleep(TimeSpan.FromSeconds(ExtraTimeInWaitingRoomAfterThePause));
            _browsers[_c.CurrentUser.Key].Driver.ClickAndWaitForPageToLoad(ClerkWaitingRoomPage.ResumeVideoCallButton);
        }

        [Then(@"the participant status for (.*) is displayed as (.*)")]
        public void ThenTheFirstParticipantStatusIsDisplayedAsNotSignedIn(string name, string status)
        {
            var participant = _tc.Conference.Participants.First(x => x.Name.Contains(name));
            if (participant.Id != Guid.Empty)
            {
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkWaitingRoomPage.ParticipantStatus((Guid)participant.Id)).Text.ToUpper().Trim().Should().Be(status.ToUpper());
            }
            else
            {
                throw new DataMisalignedException("Participant id is not set");
            }
        }

        [Then(@"the Clerk can see information about their case")]
        [Then(@"the Judge can see information about their case")]
        public void ThenTheClerkCanSeeInformationAboutTheirCase()
        {
            if (_tc.Hearing.Scheduled_date_time.ToLocalTime() == null || _tc.Hearing.Scheduled_duration == 0)
            {
                throw new DataMisalignedException("Scheduled dates and times must be set");

            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkWaitingRoomPage.ReturnToHearingRoomLink).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkWaitingRoomPage.ContactVho).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkWaitingRoomPage.HearingTitle).Text.Should().Be($"{_c.Test.Hearing.Cases.First().Name} ({_c.Hearing.Case_type_name}) case number: {_c.Test.Hearing.Cases.First().Number}");

            var startDate = (DateTime) _c.Hearing.Scheduled_date_time;
            var dateAndStartTime = startDate.ToLocalTime().ToString(DateFormats.ClerkWaitingRoomPageTime);
            var endTime = startDate.ToLocalTime().AddMinutes((int) _c.Hearing.Scheduled_duration).ToString(DateFormats.ClerkWaitingRoomPageTimeEnd);

            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkWaitingRoomPage.HearingDateTime).Text.Should().Be($"{dateAndStartTime} to {endTime}");
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkWaitingRoomPage.StartHearingText).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkWaitingRoomPage.IsEveryoneConnectedText).Displayed.Should().BeTrue();
        }

        [Then(@"the participant can see information about their case")]
        public void ThenTheUserCanSeeInformationAboutTheirCase()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(WaitingRoomPage.HearingCaseDetails).Text.Should().Contain(_c.Hearing.Cases.First().Name);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(WaitingRoomPage.HearingCaseDetails).Text.Should().Contain($"case number: {_c.Hearing.Cases.First().Number}");
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(WaitingRoomPage.HearingDate).Text.Should().Contain(_c.Hearing.Scheduled_date_time?.ToString(DateFormats.WaitingRoomPageDate));
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(WaitingRoomPage.HearingDate).Text.Should().Contain(_c.Hearing.Scheduled_date_time?.ToLocalTime().ToString(DateFormats.WaitingRoomPageTime));

            if (_c.Hearing.Scheduled_duration != null)
            {
                var endTime = _c.Hearing.Scheduled_date_time?.AddMinutes((int)_c.Hearing.Scheduled_duration).ToLocalTime().ToString(DateFormats.WaitingRoomPageTime);
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(WaitingRoomPage.HearingDate).Text.Should().Contain(endTime);
            }

            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(WaitingRoomPage.ContactVhTeam).Displayed.Should().BeTrue();
        }

        [Then(@"the user can see a list of participants and their representatives")]
        public void ThenTheUserCanSeeAListOfParticipantsAndTheirRepresentatives()
        {
            var rowsElement = _c.CurrentUser.Role.ToLower().Equals("individual") ? WaitingRoomPage.IndividualParticipantsList : WaitingRoomPage.ParticipantsList;
            var allRows = _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementsVisible(rowsElement);
            var participantRowIds = (from row in allRows where row.GetAttribute("id") != "" select row.GetAttribute("id")).ToList();
            var participantsInformation = (from id in participantRowIds select _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementsVisible(WaitingRoomPage.RowInformation(id)) into infoRows where infoRows.Count > 0 select new ParticipantInformation {CaseTypeGroup = infoRows[0].Text, Name = infoRows[1].Text, Representee = infoRows.Count.Equals(3) ? infoRows[2].Text : null}).ToList();

            foreach (var participant in _c.Conference.Participants)
            {
                if (!participant.User_role.Equals(UserRole.Individual) &&
                    !participant.User_role.Equals(UserRole.Representative)) continue;
                foreach (var row in participantsInformation)
                {
                    if (!row.Name.Equals(participant.Name)) continue;
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
            foreach (var participant in _c.Hearing.Participants.Where(participant => participant.Hearing_role_name.Equals("Individual") ||
                                                                                     participant.Hearing_role_name.Equals("Representative")))
            {
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(WaitingRoomPage.OtherParticipantsStatus(participant.Display_name)).Text.Should().Be("Unavailable");
            }
        }

        [Then(@"the user can see the hearing is (.*) title")]
        public void ThenTheUserCanSeeTheHearingIsAAboutToBeginTitle(string title)
        {
            var headerElement = title.Equals("delayed") ? WaitingRoomPage.DelayedHeader : WaitingRoomPage.ScheduledHeader;
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(headerElement).Displayed.Should().BeTrue();
        }

        [Then(@"the user can see a (.*) box and a delayed message")]
        [Then(@"the user can see a (.*) box and a scheduled message")]
        [Then(@"the user can see a (.*) box and an about to begin message")]
        public void ThenTheUserCanSeeABlackBoxAndAAboutToBeginMessage(string colour)
        {
            _browsers[_c.CurrentUser.Key].Driver.ExecuteJavaScript("arguments[0].scrollIntoView(true);", _browsers[_c.CurrentUser.Key].Driver.FindElement(WaitingRoomPage.TimePanel));
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(WaitingRoomPage.TimePanel).Displayed.Should().BeTrue();
            var backgroundColourInHex = ConvertRgbToHex(_browsers[_c.CurrentUser.Key].Driver.WaitUntilElementExists(WaitingRoomPage.TimePanel).GetCssValue("background-color"));

            switch (colour)
            {
                case "black":
                {
                    backgroundColourInHex.Should().Be(WaitingRoomPage.AboutToBeginBgColour);
                    _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementExists(WaitingRoomPage.AboutToBeginText)
                        .Displayed.Should().BeTrue();
                    break;
                }
                case "yellow":
                {
                    backgroundColourInHex.Should().Be(WaitingRoomPage.DelayedBgColour);
                    _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementExists(WaitingRoomPage.DelayedText)
                        .Displayed.Should().BeTrue();
                    break;
                }
                case "blue":
                {
                    backgroundColourInHex.Should().Be(WaitingRoomPage.ScheduledBgColour);
                    _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementExists(WaitingRoomPage.ScheduledText)
                        .Displayed.Should().BeTrue();
                    break;
                }
                default: throw new ArgumentOutOfRangeException($"No defined colour: '{colour}'");
            }
        }

        [Then(@"the Clerk waiting room displays the paused status")]
        public void ThenTheClerkWaitingRoomDisplaysThePausedStatus()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkWaitingRoomPage.PausedText)
                .Displayed.Should().BeTrue();
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

        private static string ConvertRgbToHex(string rgbCssValue)
        {
            var numbers = rgbCssValue.Replace("rgba(", "").Replace(")", "").Split(",");
            var r = int.Parse(numbers[0].Trim());
            var g = int.Parse(numbers[1].Trim());
            var b = int.Parse(numbers[2].Trim());
            var rgbColour = Color.FromArgb(r, g, b);
            var hex = "#" + rgbColour.R.ToString("X2") + rgbColour.G.ToString("X2") + rgbColour.B.ToString("X2");
            return hex.ToLower();
        }

        [When(@"the Clerk starts the hearing")]
        public void ProgressToNextPage()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkWaitingRoomPage.StartHearingText).Displayed.Should().BeTrue();
            CheckParticipantsAreStillConnected();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkWaitingRoomPage.StartVideoHearingButton).Click();
        }

        private void CheckParticipantsAreStillConnected()
        {
            foreach (var user in _browsers.Keys.Select(lastname => _c.Conference.Participants.First(x => x.Name.ToLower().Contains(lastname.ToLower()))).Where(user => !user.User_role.Equals(UserRole.Judge) && user.Id != null))
            {
                _browsers[_c.CurrentUser.Key].Driver.ExecuteJavaScript("arguments[0].scrollIntoView(true);", _browsers[_c.CurrentUser.Key].Driver.FindElement(ClerkWaitingRoomPage.ParticipantStatus((Guid)user.Id)));
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(ClerkWaitingRoomPage.ParticipantStatus((Guid)user.Id)).Text.ToUpper().Trim()
                    .Should().Be("CONNECTED");
            }
        }
    }

    internal class ParticipantInformation
    {
        internal string CaseTypeGroup { get; set; }
        internal string Name { get; set; }
        internal string Representee { get; set; }
    }
}
