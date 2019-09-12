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
    public sealed class VideoHearingsOfficerCallSteps
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _tc;
        private readonly CommonSteps _commonSteps;
        private readonly WaitingRoomPage _page;
        private readonly VhoHearingListPage _hearingListPage;
        private readonly AdminPanelPage _adminPage;
        private const int SecondsWaitToCallAndAnswer = 3;

        public VideoHearingsOfficerCallSteps(Dictionary<string, UserBrowser> browsers, TestContext tc, CommonSteps commonSteps,
            WaitingRoomPage page, VhoHearingListPage hearingListPage, AdminPanelPage adminPage)
        {
            _browsers = browsers;
            _tc = tc;
            _commonSteps = commonSteps;
            _page = page;
            _hearingListPage = hearingListPage;
            _adminPage = adminPage;
        }

        [When(@"the Video Hearings Officer starts a call with (.*)")]
        public void WhenTheVideoHearingsOfficerStartsACallWithIndividual(string user)
        {
            _browsers[_tc.CurrentUser.Key].Driver
                .WaitUntilVisible(
                    _hearingListPage.VideoHearingsOfficerSelectHearingButton(_tc.Hearing.Cases.First().Number))
                .Click();

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_adminPage.ParticipantStatusTable, 60).Displayed.Should().BeTrue();
            _browsers[_tc.CurrentUser.Key].Driver.SwitchTo().Frame(AdminPanelPage.AdminIframeId);

            var participant = _tc.Conference.Participants.Find(x => x.Name.ToLower().Contains(user.ToLower()));
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_adminPage.ParticipantInIframe(participant.Display_name)).Click();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_adminPage.VhoPrivateConsultationLink).Click();

            _browsers[_tc.CurrentUser.Key].LastWindowName = _browsers[_tc.CurrentUser.Key].SwitchTab("Private Consultation");

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_adminPage.CloseButton).
                Displayed.Should().BeTrue();
        }

        [When(@"(.*) accepts the VHO call")]
        public void WhenTheParticipantAcceptsTheVhoCall(string user)
        {
            _commonSteps.GivenInTheUsersBrowser(user);

            Thread.Sleep(TimeSpan.FromSeconds(SecondsWaitToCallAndAnswer));

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_adminPage.IncomingCallMessage)
                .Displayed.Should().BeTrue();

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_adminPage.AcceptPrivateCall).Click();
        }

        [When(@"the (.*) ends the call")]
        public void WhenTheVideoHearingsOfficerEndsTheCall(string user)
        {
            _commonSteps.GivenInTheUsersBrowser(user);
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_adminPage.CloseButton).Click();
            _browsers[_tc.CurrentUser.Key].LastWindowName = _browsers[_tc.CurrentUser.Key].SwitchTab("Video Hearings");
        }

        [Then(@"the (.*) can see and hear the other user")]
        public void ThenTheVideoHearingsOfficerCanSeeAndHearTheParticipant(string user)
        {
            _commonSteps.GivenInTheUsersBrowser(user);
            new VideoIsPlaying(_browsers[_tc.CurrentUser.Key]).Feed(_adminPage.IncomingVideo);
        }

        [Then(@"the (.*) user can no longer see the alert")]
        [Then(@"the (.*) user does not see an alert")]
        public void ThenTheIndividualCanNoLongerSeeTheAlert(string user)
        {
            _commonSteps.GivenInTheUsersBrowser(user);
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementNotVisible(_adminPage.IncomingCallMessage);
        }

        [Then(@"the admin self view can be open and closed")]
        public void ThenTheAdminSelfViewCanBeOpenAndClosed()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementNotVisible(_adminPage.SelfViewVideo).Should().BeTrue();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_adminPage.SelfViewButton).Click();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_adminPage.SelfViewVideo).Displayed.Should().BeTrue();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_adminPage.SelfViewButton).Click();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementNotVisible(_adminPage.SelfViewVideo).Should().BeTrue();
        }
    }
}
