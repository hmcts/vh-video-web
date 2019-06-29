using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Actions;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class HearingsStatusSteps
    {
        private readonly TestContext _context;
        private readonly BrowserContext _browserContext;
        private readonly HearingListPage _hearingListPage;

        public HearingsStatusSteps(TestContext context, BrowserContext browserContext, HearingListPage hearingListPage)
        {
            _context = context;
            _browserContext = browserContext;
            _hearingListPage = hearingListPage;
        }

        [When(@"the hearing status changes to (.*)")]
        public void WhenTheHearingStatusChangesTooNotStarted(string status)
        {
            var actions = new Dictionary<string, IHearingStatusActions>
            {
                {"Not Started", new NotStartedAction()},
                {"Delayed", new DelayedAction()},
                {"In Session", new InSessionAction()},
                {"Paused", new PausedAction()},
                {"Suspended", new SuspendedAction()},
                {"Closed", new ClosedAction()}
            };
            actions[status].Execute(_context, GetJudgeParticipantId());
        }

        [Then(@"the Video Hearings Officer user should see a (.*) notification")]
        public void ThenTheVideoHearingsOfficerUserShouldSeeANotification(string notification)
        {
            _browserContext.NgDriver.Navigate().Refresh();

            _browserContext.NgDriver
                .WaitUntilElementVisible(
                    _hearingListPage.VideoHearingsOfficerAlertType(_context.Hearing.Cases.First().Number))
                .Text.Should().Be(notification);
        }

        [Then(@"the closedDate attribute should be populated")]
        public void WhenTheClosedDateAttributeShouldBePopulated()
        {
            ScenarioContext.Current.Pending();
        }

        private string GetJudgeParticipantId()
        {
            return _context.Conference.Participants.Find(x => x.User_role.Equals(UserRole.Judge)).Id.ToString();
        }
    }
}
