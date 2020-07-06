using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using AcceptanceTests.Common.Driver.Drivers;
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
        private const int SecondsWaitToCallAndAnswer = 15;
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
            var participant = _c.Test.ConferenceParticipants.First(x => x.Name.ToLower().Contains(user.ToLower()));
            _browsers[_c.CurrentUser.Key].ClickLink(ParticipantListPanel.PrivateConsultationLink(participant.Id.ToString()));
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(PrivateCallPopupPage.OutgoingCallMessage).Text.Should().Contain(participant.Name);
        }

        [When(@"(.*) accepts the private consultation from (.*)")]
        public void WhenTheUserAcceptsThePrivateConsultation(string user, string from)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            Thread.Sleep(TimeSpan.FromSeconds(SecondsWaitToCallAndAnswer));
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(PrivateCallPopupPage.IncomingCallMessage).Text.Should().Contain(from);
            _browsers[_c.CurrentUser.Key].Click(PrivateCallPopupPage.AcceptPrivateCall);
        }

        [When(@"(.*) rejects the private consultation")]
        public void WhenTheUserRejectsThePrivateConsultation(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            _browsers[_c.CurrentUser.Key].Click(PrivateCallPopupPage.RejectPrivateCall);
        }

        [When(@"a participant closes the private consultation")]
        public void WhenAParticipantClosesThePrivateConsultation()
        {
            _browsers[_c.CurrentUser.Key].Click(PrivateCallPopupPage.ClosePrivateConsultationButton);
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
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(PrivateCallPopupPage.CallRejectedMessage).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Click(PrivateCallPopupPage.CallRejectedCloseButton);
        }

        [Then(@"the private consultation link with (.*) is not visible")]
        public void ThenThePrivateConsultationLinkIsNotVisible(string user)
        {
            _browsers[_c.CurrentUser.Key].Refresh();
            var participantId = _c.Test.ConferenceParticipants.First(x => x.Name.ToLower().Contains(user.ToLower())).Id;
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementNotVisible(ParticipantListPanel.PrivateConsultationLink(participantId.ToString())).Should().BeTrue();
        }

        [Then(@"the (.*) user sees a message that the request has not been answered")]
        public void ThenTheRepresentativeUserSeesAMessageThatTheRequestHasNotBeenAnswered(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(PrivateCallPopupPage.CallRejectedMessage).Displayed.Should().BeTrue();
        }
    }
}
