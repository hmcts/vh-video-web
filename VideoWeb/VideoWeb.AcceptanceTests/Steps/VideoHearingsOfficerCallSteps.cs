using System;
using System.Collections.Generic;
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
    public sealed class VideoHearingsOfficerCallSteps
    {
        private const int SecondsWaitToCallAndAnswer = 3;
        private const int Retries = 60;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _c;
        private readonly BrowserSteps _browserSteps;

        public VideoHearingsOfficerCallSteps(Dictionary<string, UserBrowser> browsers, TestContext c, BrowserSteps browserSteps)
        {
            _browsers = browsers;
            _c = c;
            _browserSteps = browserSteps;
        }

        [When(@"the Video Hearings Officer starts a call with (.*)")]
        public void WhenTheVideoHearingsOfficerStartsACallWithIndividual(string user)
        {
            _browsers[_c.CurrentUser.Key].Click(VhoHearingListPage.VideoHearingsOfficerSelectHearingButton(_c.Test.Case.Number));
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(AdminPanelPage.ParticipantStatusTable, 60).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.SwitchTo().Frame(AdminPanelPage.AdminIframeId);
            var participant = _c.Test.ConferenceParticipants.Find(x => x.Name.ToLower().Contains(user.ToLower()));
            _browsers[_c.CurrentUser.Key].Click(AdminPanelPage.ParticipantInIframe(participant.Display_name));
            _browsers[_c.CurrentUser.Key].Click(AdminPanelPage.VhoPrivateConsultationLink(participant.Id));
            _browsers[_c.CurrentUser.Key].LastWindowName = _browsers[_c.CurrentUser.Key].SwitchTab("Private Consultation");
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(AdminPanelPage.CloseButton).Displayed.Should().BeTrue();
        }

        [When(@"(.*) accepts the VHO call")]
        public void WhenTheParticipantAcceptsTheVhoCall(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            Thread.Sleep(TimeSpan.FromSeconds(SecondsWaitToCallAndAnswer));
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(AdminPanelPage.IncomingCallMessage).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Click(AdminPanelPage.AcceptPrivateCall);
        }

        [When(@"the (.*) ends the call")]
        public void WhenTheVideoHearingsOfficerEndsTheCall(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            _browsers[_c.CurrentUser.Key].Click(AdminPanelPage.CloseButton);
            _browsers[_c.CurrentUser.Key].LastWindowName = _browsers[_c.CurrentUser.Key].SwitchTab("Video Hearings");
        }

        [Then(@"the (.*) can see and hear the other user")]
        public void ThenTheVideoHearingsOfficerCanSeeAndHearTheParticipant(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            new VerifyVideoIsPlayingBuilder(_browsers[_c.CurrentUser.Key])
                .Retries(Retries).Feed(user.ToLower().Equals("video hearings officer")
                ? AdminPanelPage.IncomingVideo
                : AdminPanelPage.IncomingFeed);
        }

        [Then(@"the (.*) user can no longer see the alert")]
        [Then(@"the (.*) user does not see an alert")]
        public void ThenTheIndividualCanNoLongerSeeTheAlert(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementNotVisible(AdminPanelPage.IncomingCallMessage);
        }

        [Then(@"the admin self view can be open and closed")]
        public void ThenTheAdminSelfViewCanBeOpenAndClosed()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementNotVisible(AdminPanelPage.SelfViewVideo).Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Click(AdminPanelPage.SelfViewButton);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(AdminPanelPage.SelfViewVideo).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Click(AdminPanelPage.SelfViewButton);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementNotVisible(AdminPanelPage.SelfViewVideo).Should().BeTrue();
        }
    }
}
