using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.AcceptanceTests.Users;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class PrivateConsultationSteps
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _tc;
        private readonly CommonSteps _commonSteps;
        private readonly WaitingRoomPage _waitingRoomPage;

        public PrivateConsultationSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext, 
            CommonSteps commonSteps, WaitingRoomPage waitingRoomPage)
        {
            _browsers = browsers;
            _tc = testContext;
            _commonSteps = commonSteps;
            _waitingRoomPage = waitingRoomPage;
        }

        [When(@"the user starts a private consultation with (.*)")]
        public void WhenTheUserStartsAPrivateConsultationWithIndividual(string user)
        {
            var participantId = _tc.Conference.Participants.First(x => x.Name.ToLower().Contains(user.ToLower())).Id;
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_waitingRoomPage.PrivateConsultationLink(participantId.ToString())).Click();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_waitingRoomPage.OutgoingCallMessage)
                .Displayed.Should().BeTrue();
        }

        [When(@"(.*) accepts the private consultation")]
        public void WhenTheUserAcceptsThePrivateConsultation(string user)
        {
            _commonSteps.GivenInTheUsersBrowser(user);
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_waitingRoomPage.IncomingCallMessage)
                .Displayed.Should().BeTrue();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_waitingRoomPage.AcceptPrivateCall()).Click();
        }

        [When(@"(.*) rejects the private consultation")]
        public void WhenTheUserRejectsThePrivateConsultation(string user)
        {
            _commonSteps.GivenInTheUsersBrowser(user);
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_waitingRoomPage.RejectPrivateCall()).Click();
        }

        [Then(@"the participants can talk to each other")]
        public void ThenTheParticipantsCanTalkToEachOther()
        {
            ScenarioContext.Current.Pending();
        }
    }
}
