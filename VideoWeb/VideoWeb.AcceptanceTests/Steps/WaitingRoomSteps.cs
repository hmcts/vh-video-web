using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using FluentAssertions;
using TechTalk.SpecFlow;
using Testing.Common.Builders;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class WaitingRoomSteps
    {
        private readonly BrowserContext _browserContext;
        private readonly TestContext _context;
        private readonly WaitingRoomPage _waitingRoomPage;

        public WaitingRoomSteps(BrowserContext browserContext, TestContext context,
            WaitingRoomPage waitingRoomPage)
        {
            _browserContext = browserContext;
            _context = context;
            _waitingRoomPage = waitingRoomPage;
        }

        [Then(@"the user can see information about their case")]
        public void ThenTheUserCanSeeInformationAboutTheirCase()
        {
            _browserContext.NgDriver.WaitUntilElementVisible(_waitingRoomPage.HearingName).Text
                .Should().Be(_context.Hearing.Cases.First().Name);
            _browserContext.NgDriver.WaitUntilElementVisible(_waitingRoomPage.CaseNumber).Text
                .Should().Be($"Case number: {_context.Hearing.Cases.First().Number}");
            _browserContext.NgDriver.WaitUntilElementVisible(_waitingRoomPage.HearingDate).Text
                .Should().Contain(_context.Hearing.Scheduled_date_time?.ToString(DateFormats.WaitingRoomPageDate));

            if (_context.CurrentUser.Role.Equals("Judge"))
            {
                _browserContext.NgDriver.WaitUntilElementVisible(_waitingRoomPage.ReturnToHearingRoomLink).Displayed
                    .Should().BeTrue();
                _browserContext.NgDriver.WaitUntilElementVisible(_waitingRoomPage.ContactVho).Displayed
                    .Should().BeTrue();
                _browserContext.NgDriver.WaitUntilElementVisible(_waitingRoomPage.JudgeHearingTime).Text
                    .Should().Contain(_context.Hearing.Scheduled_date_time?.ToLocalTime().ToString(DateFormats.JudgeWaitingRoomPageTime));
                _browserContext.NgDriver.WaitUntilElementVisible(_waitingRoomPage.ScheduledDuration).Text
                    .Should().Contain($"scheduled for {_context.Hearing.Scheduled_duration?.ToString()} minutes");
            }
            else
            {
                _browserContext.NgDriver.WaitUntilElementVisible(_waitingRoomPage.HearingDate).Text
                    .Should().Contain(_context.Hearing.Scheduled_date_time?.ToString(DateFormats.WaitingRoomPageTime));
                if (_context.Hearing.Scheduled_duration != null)
                {
                    var endTime = _context.Hearing.Scheduled_date_time?.AddMinutes((int)_context.Hearing.Scheduled_duration)
                        .ToString(DateFormats.WaitingRoomPageTime);
                    _browserContext.NgDriver.WaitUntilElementVisible(_waitingRoomPage.HearingDate).Text
                        .Should().Contain(endTime);
                }
                _browserContext.NgDriver.WaitUntilElementVisible(_waitingRoomPage.ContactHelpline).Displayed
                    .Should().BeTrue();
            }
        }

        [Then(@"the user can see a list of participants and their representatives")]
        public void ThenTheUserCanSeeAListOfParticipantsAndTheirRepresentatives()
        {
            var allRows = _browserContext.NgDriver.WaitUntilElementsVisible(_waitingRoomPage.ParticipantsList);
            var participantRowIds = (from row in allRows where row.GetAttribute("id") != "" select row.GetAttribute("id")).ToList();
            var participantsInformation = new List<ParticipantInformation>();
            foreach (var id in participantRowIds)
            {
                var infoRows = _browserContext.NgDriver.WaitUntilElementsVisible(_waitingRoomPage.RowInformation(id));
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
                    _browserContext.NgDriver.WaitUntilElementVisible(_waitingRoomPage.ParticipantStatus(participant.Display_name)).Text
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
                    _browserContext.NgDriver.WaitUntilElementVisible(_waitingRoomPage.AboutToBeginHeader).Displayed.Should()
                        .BeTrue();
                    break;
                }
                case "delayed":
                {
                    _browserContext.NgDriver.WaitUntilElementVisible(_waitingRoomPage.DelayedHeader).Displayed.Should()
                        .BeTrue();
                    break;
                }
                case "scheduled":
                {
                    _browserContext.NgDriver.WaitUntilElementVisible(_waitingRoomPage.ScheduledHeader).Displayed.Should()
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
            _browserContext.NgDriver.WaitUntilElementVisible(_waitingRoomPage.TimePanel).Displayed.Should()
                .BeTrue();

            var backgroundColourInHex = ConvertRgbToHex(_browserContext.NgDriver.WaitUntilElementVisible(_waitingRoomPage.TimePanel)
                .GetCssValue("background-color"));

            switch (colour)
            {
                case "black":
                {
                    backgroundColourInHex.Should().Be(_waitingRoomPage.AboutToBeginBgColour);
                    _browserContext.NgDriver.WaitUntilElementVisible(_waitingRoomPage.AboutToBeginText).Displayed
                        .Should().BeTrue();
                        break;
                }
                case "yellow":
                {
                    backgroundColourInHex.Should().Be(_waitingRoomPage.DelayedBgColour);
                    _browserContext.NgDriver.WaitUntilElementVisible(_waitingRoomPage.DelayedText).Displayed
                        .Should().BeTrue();
                        break;
                }
                case "blue":
                {
                    backgroundColourInHex.Should().Be(_waitingRoomPage.ScheduledBgColour);
                    _browserContext.NgDriver.WaitUntilElementVisible(_waitingRoomPage.ScheduledText).Displayed
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
