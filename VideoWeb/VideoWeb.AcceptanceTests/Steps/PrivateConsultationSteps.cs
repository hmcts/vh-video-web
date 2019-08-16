using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Assertions;
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

        [When(@"a participant closes the private consultation")]
        public void WhenAParticipantClosesThePrivateConsultation()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_waitingRoomPage.ClosePrivateConsultationButton).Click();
        }

        [Then(@"(.*) can see the other participant")]
        public void ThenTheParticipantsCanTalkToEachOther(string user)
        {
            _commonSteps.GivenInTheUsersBrowser(user);
            new VideoIsPlaying(_browsers[_tc.CurrentUser.Key]).Feed(_waitingRoomPage.IncomingVideo);
        }

        [Then(@"the self view can be open and closed")]
        public void ThenTheSelfViewCanBeOpenAndClosed()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementNotVisible(_waitingRoomPage.SelfViewVideo).Should().BeTrue();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_waitingRoomPage.SelfViewButton).Click();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_waitingRoomPage.SelfViewVideo).Displayed.Should().BeTrue();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_waitingRoomPage.SelfViewButton).Click();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementNotVisible(_waitingRoomPage.SelfViewVideo).Should().BeTrue();
        }

        [Then(@"the (.*) user sees a message that the request has been rejected")]
        public void ThenTheRepresentativeUserSeesAMessageThatTheRequestHasBeenRejected(string user)
        {
            _commonSteps.GivenInTheUsersBrowser(user);
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_waitingRoomPage.CallRejectedMessage)
                .Displayed.Should().BeTrue();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_waitingRoomPage.CallRejectedCloseButton).Click();
        }

        [Then(@"the private consultation link with (.*) is not visible")]
        public void ThenThePrivateConsultationLinkIsNotVisible(string user)
        {
            var participantId = _tc.Conference.Participants.First(x => x.Name.ToLower().Contains(user.ToLower())).Id;
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementNotVisible(_waitingRoomPage.PrivateConsultationLink(participantId.ToString())).Should().BeTrue();
        }

    }
}
