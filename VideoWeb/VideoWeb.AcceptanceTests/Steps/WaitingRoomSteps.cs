using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Threading;
using FluentAssertions;
using OpenQA.Selenium.Support.Extensions;
using TechTalk.SpecFlow;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.AcceptanceTests.Users;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class WaitingRoomSteps : ISteps
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _tc;
        private readonly WaitingRoomPage _page;
        private readonly ClerkWaitingRoomPage _clerkPage;
        private readonly CommonSteps _commonSteps;
        private const int ExtraTimeInWaitingRoomAfterThePause = 10;

        public WaitingRoomSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext,
            WaitingRoomPage page, ClerkWaitingRoomPage clerkPage, CommonSteps commonSteps)
        {
            _browsers = browsers;
            _tc = testContext;
            _page = page;
            _clerkPage = clerkPage;
            _commonSteps = commonSteps;
        }

        [When(@"the user navigates back to the hearing list")]
        public void WhenTheUserNavigatesBackToTheHearingList()
        {
            _browsers[_tc.CurrentUser.Key].Driver.ClickAndWaitForPageToLoad(_clerkPage.ReturnToHearingRoomLink);
        }

        [When(@"the Clerk resumes the hearing")]
        public void ThenTheUserResumesTheHearing()
        {
            Thread.Sleep(TimeSpan.FromSeconds(ExtraTimeInWaitingRoomAfterThePause));
            _browsers[_tc.CurrentUser.Key].Driver.ClickAndWaitForPageToLoad(_clerkPage.ResumeVideoCallButton);
        }

        [Then(@"the participant status for (.*) is displayed as (.*)")]
        public void ThenTheFirstParticipantStatusIsDisplayedAsNotSignedIn(string name, string status)
        {
            var participant = _tc.Conference.Participants.First(x => x.Name.Contains(name));
            if (participant.Id != null)
            {
                _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_clerkPage.ParticipantStatus((Guid)participant.Id)).Text.ToUpper().Trim().Should().Be(status.ToUpper());
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
            if (_tc.Hearing.Scheduled_date_time?.ToLocalTime() == null || _tc.Hearing.Scheduled_duration == null)
            {
                throw new DataMisalignedException("Scheduled dates and times must be set");
            }

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_clerkPage.ReturnToHearingRoomLink)
                .Displayed.Should().BeTrue();

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_clerkPage.ContactVho)
                .Displayed.Should().BeTrue();

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_clerkPage.HearingTitle).Text.Should()
                .Be($"{_tc.Cases.First().Name} ({_tc.Hearing.Case_type_name}) case number: {_tc.Cases.First().Number}");

            var startdate = (DateTime) _tc.Hearing.Scheduled_date_time?.ToLocalTime();
            var dateAndStartTime = startdate.ToString(DateFormats.ClerkWaitingRoomPageTime);
            var endtime = startdate.AddMinutes((int) _tc.Hearing.Scheduled_duration)
                .ToString(DateFormats.ClerkWaitingRoomPageTimeEnd);

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_clerkPage.HearingDateTime).Text.Should()
                .Be($"{dateAndStartTime} to {endtime}");

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_clerkPage.StartHearingText).Displayed
                .Should().BeTrue();

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_clerkPage.IsEveryoneConnectedText).Displayed
                .Should().BeTrue();
        }

        [Then(@"the participant can see information about their case")]
        public void ThenTheUserCanSeeInformationAboutTheirCase()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.HearingCaseDetails).Text
                .Should().Contain(_tc.Hearing.Cases.First().Name);

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.HearingCaseDetails).Text
                .Should().Contain($"case number: {_tc.Hearing.Cases.First().Number}");

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.HearingDate).Text
                .Should().Contain(_tc.Hearing.Scheduled_date_time?.ToString(DateFormats.WaitingRoomPageDate));

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.HearingDate).Text
                .Should().Contain(_tc.Hearing.Scheduled_date_time?.ToLocalTime().ToString(DateFormats.WaitingRoomPageTime));

            if (_tc.Hearing.Scheduled_duration != null)
            {
                var endTime = _tc.Hearing.Scheduled_date_time?.AddMinutes((int)_tc.Hearing.Scheduled_duration).ToLocalTime()
                    .ToString(DateFormats.WaitingRoomPageTime);
                _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.HearingDate).Text
                    .Should().Contain(endTime);
            }

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.ContactVhTeam).Displayed
                .Should().BeTrue();
        }

        [Then(@"the user can see a list of participants and their representatives")]
        public void ThenTheUserCanSeeAListOfParticipantsAndTheirRepresentatives()
        {
            var rowsElement = _tc.CurrentUser.Role.ToLower().Equals("individual") ? _page.IndividualParticipantsList : _page.ParticipantsList;
            var allRows = _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementsVisible(rowsElement);
            var participantRowIds = (from row in allRows where row.GetAttribute("id") != "" select row.GetAttribute("id")).ToList();
            var participantsInformation = new List<ParticipantInformation>();
            foreach (var id in participantRowIds)
            {
                var infoRows = _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementsVisible(_page.RowInformation(id));
                if (infoRows.Count <= 0) continue;
                var participant = new ParticipantInformation
                {
                    CaseTypeGroup = infoRows[0].Text,
                    Name = infoRows[1].Text,
                    Representee = infoRows.Count.Equals(3) ? infoRows[2].Text : null
                };
                participantsInformation.Add(participant);
            }

            foreach (var participant in _tc.Conference.Participants)
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
            foreach (var participant in _tc.Hearing.Participants)
            {
                if (participant.Hearing_role_name.Equals("Individual") ||
                    participant.Hearing_role_name.Equals("Representative"))
                {
                    _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.OtherParticipantsStatus(participant.Display_name)).Text
                        .Should().Be("Unavailable");
                }
            }
        }

        [Then(@"the user can see the hearing is (.*) title")]
        public void ThenTheUserCanSeeTheHearingIsAAboutToBeginTitle(string title)
        {
            var headerElement = title.Equals("delayed") ? _page.DelayedHeader : _page.ScheduledHeader;

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(headerElement)
                .Displayed.Should().BeTrue();
        }

        [Then(@"the user can see a (.*) box and a (.*) message")]
        [Then(@"the user can see a (.*) box and an (.*) message")]
        public void ThenTheUserCanSeeABlackBoxAndAAboutToBeginMessage(string colour, string message)
        {
            _browsers[_tc.CurrentUser.Key].Driver.ExecuteJavaScript("arguments[0].scrollIntoView(true);", _browsers[_tc.CurrentUser.Key].Driver.FindElement(_page.TimePanel));

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.TimePanel)
                .Displayed.Should().BeTrue();

            var backgroundColourInHex = ConvertRgbToHex(_browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementExists(_page.TimePanel)
                .GetCssValue("background-color"));

            switch (colour)
            {
                case "black":
                {
                    backgroundColourInHex.Should().Be(_page.AboutToBeginBgColour);
                    _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementExists(_page.AboutToBeginText)
                        .Displayed.Should().BeTrue();
                        break;
                }
                case "yellow":
                {
                    backgroundColourInHex.Should().Be(_page.DelayedBgColour);
                    _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementExists(_page.DelayedText)
                        .Displayed.Should().BeTrue();
                        break;
                }
                case "blue":
                {
                    backgroundColourInHex.Should().Be(_page.ScheduledBgColour);
                    _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementExists(_page.ScheduledText)
                        .Displayed.Should().BeTrue();
                        break;
                }
                default: throw new ArgumentOutOfRangeException($"No defined colour: '{colour}'");
            }
        }

        [Then(@"the Clerk waiting room displays the paused status")]
        public void ThenTheClerkWaitingRoomDisplaysThePausedStatus()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_clerkPage.PausedText)
                .Displayed.Should().BeTrue();
        }

        [Then(@"the participants waiting room displays the paused status")]
        public void ThenTheWaitingRoomDisplaysThePausedStatus()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.PausedTitle).Displayed.Should().BeTrue();
        }

        [Then(@"the participants waiting room displays the closed status")]
        public void ThenTheWaitingRoomDisplaysTheClosedStatus()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.ClosedTitle).Displayed.Should().BeTrue();
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
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_clerkPage.StartVideoHearingButton).Click();
        }
    }

    internal class ParticipantInformation
    {
        internal string CaseTypeGroup { get; set; }
        internal string Name { get; set; }
        internal string Representee { get; set; }
    }
}
