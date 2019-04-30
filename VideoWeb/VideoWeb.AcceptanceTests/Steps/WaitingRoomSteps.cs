using System.Linq;
using FluentAssertions;
using TechTalk.SpecFlow;
using Testing.Common.Builders;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class WaitingRoomSteps
    {
        private readonly BrowserContext _browserContext;
        private readonly TestContext _context;
        private readonly WaitingRoomPage _waitingRoomPage;
        private readonly CommonPages _commonPageElements;

        public WaitingRoomSteps(BrowserContext browserContext, TestContext context,
            WaitingRoomPage waitingRoomPage, CommonPages commonPage)
        {
            _browserContext = browserContext;
            _context = context;
            _waitingRoomPage = waitingRoomPage;
            _commonPageElements = commonPage;
        }

        [Then(@"the user can see information about their case")]
        public void ThenTheUserCanSeeInformationAboutTheirCase()
        {
            _browserContext.NgDriver.WaitUntilElementVisible(_waitingRoomPage.HearingName).Text
                .Should().Be(_context.Hearing.Cases.First().Name);
            _browserContext.NgDriver.WaitUntilElementVisible(_waitingRoomPage.CaseNumber).Text
                .Should().Be($"Case number: {_context.Hearing.Cases.First().Number}");
            _browserContext.NgDriver.WaitUntilElementVisible(_waitingRoomPage.HearingDate).Text
                .Should().Be(_context.Hearing.Scheduled_date_time?.ToString(DateFormats.WaitingRoomPageDate));
            _browserContext.NgDriver.WaitUntilElementVisible(_waitingRoomPage.ScheduledDuration).Text
                .Should().Contain($"scheduled for {_context.Hearing.Scheduled_duration?.ToString()} minutes");

            if (_context.CurrentUser.Role.Equals("Judge"))
            {
                _browserContext.NgDriver.WaitUntilElementVisible(_waitingRoomPage.ReturnToHearingRoomLink).Displayed
                    .Should().BeTrue();
                _browserContext.NgDriver.WaitUntilElementVisible(_waitingRoomPage.ContactVho).Displayed
                    .Should().BeTrue();
            }
            else
            {
                _browserContext.NgDriver.WaitUntilElementVisible(_waitingRoomPage.ContactHelpline).Displayed
                    .Should().BeTrue();
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
    }
}
