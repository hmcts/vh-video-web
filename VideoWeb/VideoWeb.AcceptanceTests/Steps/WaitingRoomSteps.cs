using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using FluentAssertions;
using TechTalk.SpecFlow;
using Testing.Common.Builders;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class WaitingRoomSteps
    {
        private readonly BrowserContext _browser;
        private readonly TestContext _context;
        private readonly WaitingRoomPage _page;
        private readonly ClerkWaitingRoomPage _clerkPage;

        public WaitingRoomSteps(BrowserContext browser, TestContext context,
            WaitingRoomPage page, ClerkWaitingRoomPage clerkPage)
        {
            _browser = browser;
            _context = context;
            _page = page;
            _clerkPage = clerkPage;
        }

        [When(@"the user navigates back to the hearing list")]
        public void WhenTheUserNavigatesBackToTheHearingList()
        {
            _browser.NgDriver.ClickAndWaitForPageToLoad(_clerkPage.ReturnToHearingRoomLink);
        }

        [Then(@"the Clerk can see information about their case")]
        [Then(@"the Judge can see information about their case")]
        public void ThenTheClerkCanSeeInformationAboutTheirCase()
        {
            if (_context.Hearing.Scheduled_date_time?.ToLocalTime() == null || _context.Hearing.Scheduled_duration == null)
            {
                throw new DataMisalignedException("Scheduled dates and times must be set");
            }

             _browser.NgDriver.WaitUntilElementVisible(_clerkPage.ReturnToHearingRoomLink).Displayed
                .Should().BeTrue();
            _browser.NgDriver.WaitUntilElementVisible(_clerkPage.ContactVho).Displayed
                .Should().BeTrue();
            _browser.NgDriver.WaitUntilElementVisible(_clerkPage.HearingTitle).Text.Should()
                .Be($"{_context.Cases.First().Name} ({_context.Hearing.Case_type_name}) case number: {_context.Cases.First().Number}");

            var startdate = (DateTime) _context.Hearing.Scheduled_date_time?.ToLocalTime();
            var dateAndStartTime = startdate.ToString(DateFormats.ClerkWaitingRoomPageTime);
            var endtime = startdate.AddMinutes((int) _context.Hearing.Scheduled_duration)
                .ToString(DateFormats.ClerkWaitingRoomPageTimeEnd);

            _browser.NgDriver.WaitUntilElementVisible(_clerkPage.HearingDateTime).Text.Should()
                .Be($"{dateAndStartTime} to {endtime}");

            _browser.NgDriver.WaitUntilElementVisible(_clerkPage.StartHearingText).Displayed
                .Should().BeTrue();

            _browser.NgDriver.WaitUntilElementVisible(_clerkPage.IsEveryoneConnectedText).Displayed
                .Should().BeTrue();
        }

        [Then(@"the participant can see information about their case")]
        public void ThenTheUserCanSeeInformationAboutTheirCase()
        {
            _browser.NgDriver.WaitUntilElementVisible(_page.HearingName).Text
                .Should().Be(_context.Hearing.Cases.First().Name);
            _browser.NgDriver.WaitUntilElementVisible(_page.CaseNumber).Text
                .Should().Be($"Case number: {_context.Hearing.Cases.First().Number}");
            _browser.NgDriver.WaitUntilElementVisible(_page.HearingDate).Text
                .Should().Contain(_context.Hearing.Scheduled_date_time?.ToString(DateFormats.WaitingRoomPageDate));

            _browser.NgDriver.WaitUntilElementVisible(_page.HearingDate).Text
                .Should().Contain(_context.Hearing.Scheduled_date_time?.ToString(DateFormats.WaitingRoomPageTime));

            if (_context.Hearing.Scheduled_duration != null)
            {
                var endTime = _context.Hearing.Scheduled_date_time?.AddMinutes((int)_context.Hearing.Scheduled_duration)
                    .ToString(DateFormats.WaitingRoomPageTime);
                _browser.NgDriver.WaitUntilElementVisible(_page.HearingDate).Text
                    .Should().Contain(endTime);
            }

            _browser.NgDriver.WaitUntilElementVisible(_page.ContactHelpline).Displayed
                .Should().BeTrue();
        }

        [Then(@"the user can see a list of participants and their representatives")]
        public void ThenTheUserCanSeeAListOfParticipantsAndTheirRepresentatives()
        {
            var allRows = _browser.NgDriver.WaitUntilElementsVisible(_page.ParticipantsList);
            var participantRowIds = (from row in allRows where row.GetAttribute("id") != "" select row.GetAttribute("id")).ToList();
            var participantsInformation = new List<ParticipantInformation>();
            foreach (var id in participantRowIds)
            {
                var infoRows = _browser.NgDriver.WaitUntilElementsVisible(_page.RowInformation(id));
                if (infoRows.Count <= 0) continue;
                var participant = new ParticipantInformation
                {
                    CaseTypeGroup = infoRows[0].Text,
                    Name = infoRows[1].Text,
                    Representee = infoRows.Count.Equals(3) ? infoRows[2].Text : null
                };
                participantsInformation.Add(participant);
            }

            foreach (var participant in _context.Conference.Participants)
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
            foreach (var participant in _context.Hearing.Participants)
            {
                if (participant.Hearing_role_name.Equals("Individual") ||
                    participant.Hearing_role_name.Equals("Representative"))
                {
                    _browser.NgDriver.WaitUntilElementVisible(_page.ParticipantStatus(participant.Display_name)).Text
                        .Should().Be("Unavailable");
                }
            }
        }

        [Then(@"the user can see the hearing is (.*) title")]
        public void ThenTheUserCanSeeTheHearingIsAAboutToBeginTitle(string title)
        {
            switch (title)
            {
                case "about to begin":
                {
                    _browser.NgDriver.WaitUntilElementVisible(_page.AboutToBeginHeader).Displayed.Should()
                        .BeTrue();
                    break;
                }
                case "delayed":
                {
                    _browser.NgDriver.WaitUntilElementVisible(_page.DelayedHeader).Displayed.Should()
                        .BeTrue();
                    break;
                }
                case "scheduled":
                {
                    _browser.NgDriver.WaitUntilElementVisible(_page.ScheduledHeader).Displayed.Should()
                        .BeTrue();
                    break;
                }
                default: throw new ArgumentOutOfRangeException($"No such title: '{title}'");
            }                      
        }

        [Then(@"the user can see a (.*) box and a (.*) message")]
        [Then(@"the user can see a (.*) box and an (.*) message")]
        public void ThenTheUserCanSeeABlackBoxAndAAboutToBeginMessage(string colour, string message)
        {
            _browser.NgDriver.WaitUntilElementVisible(_page.TimePanel).Displayed.Should()
                .BeTrue();

            var backgroundColourInHex = ConvertRgbToHex(_browser.NgDriver.WaitUntilElementVisible(_page.TimePanel)
                .GetCssValue("background-color"));

            switch (colour)
            {
                case "black":
                {
                    backgroundColourInHex.Should().Be(_page.AboutToBeginBgColour);
                    _browser.NgDriver.WaitUntilElementVisible(_page.AboutToBeginText).Displayed
                        .Should().BeTrue();
                        break;
                }
                case "yellow":
                {
                    backgroundColourInHex.Should().Be(_page.DelayedBgColour);
                    _browser.NgDriver.WaitUntilElementVisible(_page.DelayedText).Displayed
                        .Should().BeTrue();
                        break;
                }
                case "blue":
                {
                    backgroundColourInHex.Should().Be(_page.ScheduledBgColour);
                    _browser.NgDriver.WaitUntilElementVisible(_page.ScheduledText).Displayed
                        .Should().BeTrue();
                        break;
                }
                default: throw new ArgumentOutOfRangeException($"No defined colour: '{colour}'");
            }
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
    }

    internal class ParticipantInformation
    {
        internal string CaseTypeGroup { get; set; }
        internal string Name { get; set; }
        internal string Representee { get; set; }
    }
}
