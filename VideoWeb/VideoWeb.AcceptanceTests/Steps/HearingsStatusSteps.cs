using System;
using System.Collections.Generic;
using System.Linq;
using AcceptanceTests.Common.Api.Requests;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Api;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.AcceptanceTests.Strategies.HearingStatus;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class HearingsStatusSteps
    {
        private const int MaxRetries = 20;
        private readonly TestContext _c;
        private readonly Dictionary<string, UserBrowser> _browsers;

        public HearingsStatusSteps(Dictionary<string, UserBrowser> browsers, TestContext c)
        {
            _c = c;
            _browsers = browsers;
        }

        [Given(@"the hearing status changes to (.*)")]
        [When(@"the hearing status changes to (.*)")]
        public void WhenTheHearingStatusChangesTooNotStarted(string status)
        {
            var actions = new Dictionary<string, IHearingStatusStrategies>
            {
                {"Not Started", new NotStartedStrategy()},
                {"Delayed", new DelayedStrategy()},
                {"In Session", new InSessionStrategy()},
                {"Paused", new PausedStrategy()},
                {"Suspended", new SuspendedStrategy()},
                {"Closed", new ClosedStrategy()}
            };
            actions[status].Execute(_c, GetJudgeParticipantId());
        }

        [Then(@"the hearings should be in chronological order")]
        public void ThenTheHearingsShouldBeInChronologicalOrder()
        {
            var displayedCaseOrder = _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementsVisible(VhoHearingListPage.VideoHearingsCaseNumbers);
            var automationCaseNumberLength = _c.Test.Case.Number.Length;
            var automationOnlyCases = displayedCaseOrder.Select(caseNumber => caseNumber.Text).Where(caseNumberText => caseNumberText.Length.Equals(automationCaseNumberLength) && caseNumberText.Contains("/")).ToList();
            automationOnlyCases.Should().NotBeNullOrEmpty();
            automationOnlyCases.First().Should().Be(_c.Test.Case.Number);
        }

        [Then(@"the Video Hearings Officer user should see a (.*) notification")]
        public void ThenTheVideoHearingsOfficerUserShouldSeeANotification(string notification)
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(VhoHearingListPage.HearingStatusBadge(_c.Test.Conference.Id)).Text.Should().Be(notification);
        }

        [Then(@"the closedDate attribute should be populated")]
        public void WhenTheClosedDateAttributeShouldBePopulated()
        {
            var response = _c.Apis.VideoApi.GetConferenceByConferenceId(_c.Test.Conference.Id);
            var conference = RequestHelper.DeserialiseSnakeCaseJsonToResponse<ConferenceDetailsResponse>(response.Content);
            conference.Closed_date_time?.Date.Should().Be(DateTime.Now.Date);
        }

        [Then(@"the hearing status changed to (.*)")]
        public void ThenTheHearingStatusChanges(ConferenceState state)
        {
            var conferenceState = new PollForConferenceStatus(_c.Apis.VideoApi)
                    .WithConferenceId(_c.Test.Conference.Id)
                    .WithExpectedState(state)
                    .Retries(MaxRetries)
                    .Poll();
            conferenceState.Should().Be(state);
        }

        private Guid GetJudgeParticipantId()
        {
            var id = _c.Test.ConferenceParticipants.Find(x => x.User_role.Equals(UserRole.Judge)).Id;
            if (id == Guid.Empty)
                throw new DataMisalignedException("Participant Id cannot be null");
            return id;
        }
    }
}
