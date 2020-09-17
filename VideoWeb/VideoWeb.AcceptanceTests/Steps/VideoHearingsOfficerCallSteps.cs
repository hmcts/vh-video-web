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
using VideoWeb.Services.TestApi;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class VideoHearingsOfficerCallSteps
    {
        private const int SecondsWaitToCallAndAnswer = 5;
        private const int SecondsDelayBeforeCallingTheParticipant = 5;
        private const int Retries = 60;
        private readonly Dictionary<User, UserBrowser> _browsers;
        private readonly TestContext _c;
        private readonly BrowserSteps _browserSteps;

        public VideoHearingsOfficerCallSteps(Dictionary<User, UserBrowser> browsers, TestContext c, BrowserSteps browserSteps)
        {
            _browsers = browsers;
            _c = c;
            _browserSteps = browserSteps;
        }

        [When(@"the Video Hearings Officer starts a call with (.*)")]
        public void WhenTheVideoHearingsOfficerStartsACallWithIndividual(string user)
        {
            Scrolling.ScrollToTheHearing(_browsers[_c.CurrentUser], _c.Test.Conference.Id);
            _browsers[_c.CurrentUser].Click(VhoHearingListPage.SelectHearingButton(_c.Test.Conference.Id));
            Scrolling.ScrollToTheTopOfThePage(_browsers[_c.CurrentUser]);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AdminPanelPage.ParticipantStatusTable, 60).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.SwitchTo().Frame(AdminPanelPage.AdminIframeId);
            var participant = _c.Test.ConferenceParticipants.First(x => x.Name.ToLower().Contains(user.ToLower()));
            Thread.Sleep(TimeSpan.FromSeconds(SecondsDelayBeforeCallingTheParticipant));
            _browsers[_c.CurrentUser].Click(AdminPanelPage.ParticipantInIframe(participant.Display_name));
            Thread.Sleep(TimeSpan.FromSeconds(SecondsDelayBeforeCallingTheParticipant));
            _browsers[_c.CurrentUser].Click(AdminPanelPage.VhoPrivateConsultationLink(participant.Id));
            _browsers[_c.CurrentUser].LastWindowName = _browsers[_c.CurrentUser].SwitchTab("Private Consultation");
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AdminPanelPage.CloseButton).Displayed.Should().BeTrue();
        }

        [When(@"(.*) accepts the VHO call")]
        public void WhenTheParticipantAcceptsTheVhoCall(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            Thread.Sleep(TimeSpan.FromSeconds(SecondsWaitToCallAndAnswer));
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(PrivateCallPopupPage.VhoIncomingCallMessage).Text.Should().Contain("Video Hearings Team");
            _browsers[_c.CurrentUser].Click(PrivateCallPopupPage.AcceptPrivateCall);
        }

        [When(@"the (.*) ends the call")]
        public void WhenTheVideoHearingsOfficerEndsTheCall(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            _browsers[_c.CurrentUser].Click(AdminPanelPage.CloseButton);
            _browsers[_c.CurrentUser].LastWindowName = _browsers[_c.CurrentUser].SwitchTab("Video Hearings");
        }

        [Then(@"the (.*) can see and hear the other user")]
        public void ThenTheVideoHearingsOfficerCanSeeAndHearTheParticipant(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            new VerifyVideoIsPlayingBuilder(_browsers[_c.CurrentUser])
                .Retries(Retries).Feed(user.ToLower().Equals("video hearings officer")
                ? AdminPanelPage.IncomingVideo
                : AdminPanelPage.IncomingFeed);
        }

        [Then(@"the (.*) user can no longer see the alert")]
        [Then(@"the (.*) user does not see an alert")]
        public void ThenTheIndividualCanNoLongerSeeTheAlert(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            _browsers[_c.CurrentUser].Driver.WaitUntilElementNotVisible(PrivateCallPopupPage.IncomingCallMessage);
        }

        [Then(@"the admin self view can be open and closed")]
        public void ThenTheAdminSelfViewCanBeOpenAndClosed()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilElementNotVisible(AdminPanelPage.SelfViewVideo).Should().BeTrue();
            _browsers[_c.CurrentUser].Click(AdminPanelPage.SelfViewButton);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AdminPanelPage.SelfViewVideo).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Click(AdminPanelPage.SelfViewButton);
            _browsers[_c.CurrentUser].Driver.WaitUntilElementNotVisible(AdminPanelPage.SelfViewVideo).Should().BeTrue();
        }

        [Then(@"the option to call (.*) is not visible")]
        public void ThenTheOptionToCallIsNotVisible(string user)
        {
            Scrolling.ScrollToTheHearing(_browsers[_c.CurrentUser], _c.Test.Conference.Id);
            _browsers[_c.CurrentUser].Click(VhoHearingListPage.SelectHearingButton(_c.Test.Conference.Id));
            Scrolling.ScrollToTheTopOfThePage(_browsers[_c.CurrentUser]);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AdminPanelPage.ParticipantStatusTable, 60).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.SwitchTo().Frame(AdminPanelPage.AdminIframeId);
            var participant = _c.Test.ConferenceParticipants.Find(x => x.Name.ToLower().Contains(user.ToLower()));
            _browsers[_c.CurrentUser].Click(AdminPanelPage.ParticipantInIframe(participant.Display_name));
            Thread.Sleep(TimeSpan.FromSeconds(SecondsDelayBeforeCallingTheParticipant));
            _browsers[_c.CurrentUser].Driver.WaitUntilElementNotVisible(AdminPanelPage.VhoPrivateConsultationLink(participant.Id)).Should().BeTrue();
        }
    }
}
