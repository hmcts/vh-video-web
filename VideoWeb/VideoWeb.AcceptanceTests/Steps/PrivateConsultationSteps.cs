using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Test.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class PrivateConsultationSteps
    {
        private const int SecondsWaitToCallAndAnswer = 3;
        private const int ExtraTimeToConnectTheParticipantsInSaucelabs = 300;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _c;
        private readonly BrowserSteps _browserSteps;

        public PrivateConsultationSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext, BrowserSteps browserSteps)
        {
            _browsers = browsers;
            _c = testContext;
            _browserSteps = browserSteps;
        }

        [When(@"the user starts a private consultation with (.*)")]
        public void WhenTheUserStartsAPrivateConsultationWithIndividual(string user)
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(WaitingRoomPage.TimePanel).Displayed.Should().BeTrue();
            Thread.Sleep(TimeSpan.FromSeconds(SecondsWaitToCallAndAnswer));
            var participantId = _c.Test.ConferenceParticipants.First(x => x.Name.ToLower().Contains(user.ToLower())).Id;
            _browsers[_c.CurrentUser.Key].ClickLink(WaitingRoomPage.PrivateConsultationLink(participantId.ToString()));
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(WaitingRoomPage.OutgoingCallMessage).Displayed.Should().BeTrue();
        }

        [When(@"(.*) accepts the private consultation")]
        public void WhenTheUserAcceptsThePrivateConsultation(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            Thread.Sleep(TimeSpan.FromSeconds(SecondsWaitToCallAndAnswer));
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(WaitingRoomPage.IncomingCallMessage).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Click(WaitingRoomPage.AcceptPrivateCall);
        }

        [When(@"(.*) rejects the private consultation")]
        public void WhenTheUserRejectsThePrivateConsultation(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            _browsers[_c.CurrentUser.Key].Click(WaitingRoomPage.RejectPrivateCall);
        }

        [When(@"a participant closes the private consultation")]
        public void WhenAParticipantClosesThePrivateConsultation()
        {
            _browsers[_c.CurrentUser.Key].Click(WaitingRoomPage.ClosePrivateConsultationButton);
        }

        [When(@"the user does not answer after (.*) minutes")]
        public void WhenTheUserDoesNotAnswerAfterMinutes(int minutes)
        {
            Thread.Sleep(TimeSpan.FromMinutes(minutes));
        }

        [Then(@"(.*) can see the other participant")]
        public void ThenTheParticipantsCanTalkToEachOther(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            new VerifyVideoIsPlayingBuilder(_browsers[_c.CurrentUser.Key])
                .DelayForVideoElementToAppear(ExtraTimeToConnectTheParticipantsInSaucelabs)
                .Feed(WaitingRoomPage.IncomingPrivateConsultationFeed);
        }

        [Then(@"the self view can be open and closed")]
        public void ThenTheSelfViewCanBeOpenAndClosed()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementNotVisible(WaitingRoomPage.SelfViewVideo).Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Click(WaitingRoomPage.SelfViewButton);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(WaitingRoomPage.SelfViewVideo).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Click(WaitingRoomPage.SelfViewButton);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementNotVisible(WaitingRoomPage.SelfViewVideo).Should().BeTrue();
        }

        [Then(@"the (.*) user sees a message that the request has been rejected")]
        public void ThenTheRepresentativeUserSeesAMessageThatTheRequestHasBeenRejected(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(WaitingRoomPage.CallRejectedMessage).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Click(WaitingRoomPage.CallRejectedCloseButton);
        }

        [Then(@"the private consultation link with (.*) is not visible")]
        public void ThenThePrivateConsultationLinkIsNotVisible(string user)
        {
            _browsers[_c.CurrentUser.Key].Refresh();
            var participantId = _c.Test.ConferenceParticipants.First(x => x.Name.ToLower().Contains(user.ToLower())).Id;
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementNotVisible(WaitingRoomPage.PrivateConsultationLink(participantId.ToString())).Should().BeTrue();
        }

        [Then(@"the (.*) user sees a message that the request has not been answered")]
        public void ThenTheRepresentativeUserSeesAMessageThatTheRequestHasNotBeenAnswered(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(WaitingRoomPage.CallRejectedMessage).Displayed.Should().BeTrue();
        }
    }
}
