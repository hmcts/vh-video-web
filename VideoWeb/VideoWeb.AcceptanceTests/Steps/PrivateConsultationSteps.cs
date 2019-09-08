using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
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
        private readonly WaitingRoomPage _page;
        private const int SecondsWaitToCallAndAnswer = 3;

        public PrivateConsultationSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext, 
            CommonSteps commonSteps, WaitingRoomPage page)
        {
            _browsers = browsers;
            _tc = testContext;
            _commonSteps = commonSteps;
            _page = page;
        }

        [When(@"the user starts a private consultation with (.*)")]
        public void WhenTheUserStartsAPrivateConsultationWithIndividual(string user)
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.TimePanel)
                .Displayed.Should().BeTrue();

            Thread.Sleep(TimeSpan.FromSeconds(SecondsWaitToCallAndAnswer));

            var participantId = _tc.Conference.Participants.First(x => x.Name.ToLower().Contains(user.ToLower())).Id;
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.PrivateConsultationLink(participantId.ToString())).Click();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.OutgoingCallMessage)
                .Displayed.Should().BeTrue();
        }

        [When(@"(.*) accepts the private consultation")]
        public void WhenTheUserAcceptsThePrivateConsultation(string user)
        {
            _commonSteps.GivenInTheUsersBrowser(user);

            Thread.Sleep(TimeSpan.FromSeconds(SecondsWaitToCallAndAnswer));

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.IncomingCallMessage)
                .Displayed.Should().BeTrue();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.AcceptPrivateCall()).Click();
        }

        [When(@"(.*) rejects the private consultation")]
        public void WhenTheUserRejectsThePrivateConsultation(string user)
        {
            _commonSteps.GivenInTheUsersBrowser(user);
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.RejectPrivateCall()).Click();
        }

        [When(@"a participant closes the private consultation")]
        public void WhenAParticipantClosesThePrivateConsultation()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.ClosePrivateConsultationButton).Click();
        }

        [When(@"the user does not answer after (.*) minutes")]
        public void WhenTheUserDoesNotAnswerAfterMinutes(int minutes)
        {
            Thread.Sleep(TimeSpan.FromMinutes(minutes));
        }

        [Then(@"(.*) can see the other participant")]
        public void ThenTheParticipantsCanTalkToEachOther(string user)
        {
            _commonSteps.GivenInTheUsersBrowser(user);
            new VideoIsPlaying(_browsers[_tc.CurrentUser.Key]).Feed(_page.IncomingVideo);
        }

        [Then(@"the self view can be open and closed")]
        public void ThenTheSelfViewCanBeOpenAndClosed()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementNotVisible(_page.SelfViewVideo).Should().BeTrue();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.SelfViewButton).Click();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.SelfViewVideo).Displayed.Should().BeTrue();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.SelfViewButton).Click();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementNotVisible(_page.SelfViewVideo).Should().BeTrue();
        }

        [Then(@"the (.*) user sees a message that the request has been rejected")]
        public void ThenTheRepresentativeUserSeesAMessageThatTheRequestHasBeenRejected(string user)
        {
            _commonSteps.GivenInTheUsersBrowser(user);
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.CallRejectedMessage)
                .Displayed.Should().BeTrue();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.CallRejectedCloseButton).Click();
        }

        [Then(@"the private consultation link with (.*) is not visible")]
        public void ThenThePrivateConsultationLinkIsNotVisible(string user)
        {
            _browsers[_tc.CurrentUser.Key].Driver.Navigate().Refresh();
            var participantId = _tc.Conference.Participants.First(x => x.Name.ToLower().Contains(user.ToLower())).Id;
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementNotVisible(_page.PrivateConsultationLink(participantId.ToString())).Should().BeTrue();
        }

        [Then(@"the (.*) user sees a message that the request has not been answered")]
        public void ThenTheRepresentativeUserSeesAMessageThatTheRequestHasNotBeenAnswered(string user)
        {
            _commonSteps.GivenInTheUsersBrowser(user);
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.CallRejectedMessage)
                .Displayed.Should().BeTrue();
        }
    }
}
