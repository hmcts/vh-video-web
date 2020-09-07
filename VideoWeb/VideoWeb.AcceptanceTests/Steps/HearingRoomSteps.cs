using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using AcceptanceTests.Common.Api.Helpers;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Test.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.Services.TestApi;
using VideoWeb.Services.Video;
using UserRole = VideoWeb.Services.TestApi.UserRole;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class HearingRoomSteps : ISteps
    {
        private const int CountdownDuration = 30;
        private const int ExtraTimeAfterTheCountdown = 10;
        private const int PauseCloseTransferDuration = 15;
        private readonly Dictionary<User, UserBrowser> _browsers;
        private readonly TestContext _c;
        private readonly BrowserSteps _browserSteps;

        public HearingRoomSteps(Dictionary<User, UserBrowser> browsers, TestContext testContext, BrowserSteps browserSteps)
        {
            _browsers = browsers;
            _c = testContext;
            _browserSteps = browserSteps;
        }

        [When(@"the countdown finishes")]
        public void WhenTheCountdownFinishes()
        {
            Thread.Sleep(TimeSpan.FromSeconds(CountdownDuration));
            Thread.Sleep(TimeSpan.FromSeconds(ExtraTimeAfterTheCountdown));
            new VerifyVideoIsPlayingBuilder(_browsers[_c.CurrentUser]).Feed(HearingRoomPage.JudgeIncomingVideo);
        }

        [When(@"the Judge clicks pause")]
        public void WhenTheUserClicksPause()
        {
            _browsers[_c.CurrentUser].Click(HearingRoomPage.PauseButton);
            Thread.Sleep(TimeSpan.FromSeconds(PauseCloseTransferDuration));
        }

        [When(@"the Judge clicks close")]
        public void WhenTheUserClicksClose()
        {
            _browsers[_c.CurrentUser].Click(HearingRoomPage.CloseButton);
            Thread.Sleep(TimeSpan.FromSeconds(PauseCloseTransferDuration));
        }

        [When(@"the Judge is on the Hearing Room page for (.*) seconds")]
        [Then(@"the Judge is on the Hearing Room page for (.*) seconds")]
        public void ThenTheUserIsOnTheHearingRoomPageForSeconds(int seconds)
        {
            Thread.Sleep(TimeSpan.FromSeconds(seconds));
        }

        [Then(@"the Judge is on the Hearing Room page for (.*) minute")]
        [Then(@"the Judge is on the Hearing Room page for (.*) minutes")]
        [Then(@"the participant is on the Hearing Room page for (.*) minute")]
        [Then(@"the participant is on the Hearing Room page for (.*) minutes")]
        public void ThenTheUserIsOnTheHearingRoomPageForMinutes(int minutes)
        {
            Thread.Sleep(TimeSpan.FromMinutes(minutes));
        }

        [Then(@"the hearing controls are visible")]
        public void ThenTheHearingControlsAreVisible()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(HearingRoomPage.ToggleSelfView).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(HearingRoomPage.PauseButton).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(HearingRoomPage.CloseButton).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(HearingRoomPage.TechnicalIssues).Displayed.Should().BeTrue();
        }

        [Then(@"the user can see themselves and toggle the view off and on")]
        public void ThenTheUserCanSeeThemselvesAndToggleTheViewOffAndOn()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(HearingRoomPage.SelfView).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Click(HearingRoomPage.ToggleSelfView);
            _browsers[_c.CurrentUser].Driver.WaitUntilElementNotVisible(HearingRoomPage.SelfView).Should().BeTrue();
            _browsers[_c.CurrentUser].Click(HearingRoomPage.ToggleSelfView);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(HearingRoomPage.SelfView).Displayed.Should().BeTrue();
        }

        [Then(@"the participant is back in the hearing")]
        public void ThenTheParticipantIsBackInTheHearing()
        {
            new VerifyVideoIsPlayingBuilder(_browsers[_c.CurrentUser]).Feed(HearingRoomPage.ParticipantIncomingVideo);
        }

        [Then(@"the Judge can see the participants")]
        public void ThenTheJudgeCanSeeTheOtherParticipants()
        {
            new VerifyVideoIsPlayingBuilder(_browsers[_c.CurrentUser]).Feed(HearingRoomPage.JudgeIncomingVideo);
        }

        [Then(@"(.*) can see the other participants")]
        public void ThenParticipantsCanSeeTheOtherParticipants(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            new VerifyVideoIsPlayingBuilder(_browsers[_c.CurrentUser]).Feed(HearingRoomPage.ParticipantIncomingVideo);
        }

        [Then(@"an audio recording of the hearing has been created")]
        public void ThenAnAudioRecordingOfTheHearingHasBeenCreated()
        {
            var response = _c.Apis.TestApi.GetAudioRecordingLink(_c.Test.NewHearingId);
            var audioLink = RequestHelper.Deserialise<AudioRecordingResponse>(response.Content);
            audioLink.Should().NotBeNull();
            audioLink.Audio_file_link.ToLower().Should().Contain(_c.Test.NewHearingId.ToString().ToLower());
        }

        [Then(@"the VHO can see that (.*) is in the Waiting Room")]
        public void ThenTheVHOCanSeeThatAllTheParticipantsAreInTheWaitingRoom(string lastname)
        {
            SwitchToTheVhoIframe();
            var participantId = _c.Test.Conference.Participants.First(x => x.Name.ToLower().Contains(lastname.ToLower())).Id;
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AdminPanelPage.ParticipantInWaitingRoom(participantId)).Displayed.Should().BeTrue();
            SwitchToDefaultContent();
        }

        [Then(@"the VHO can see that the Judge and (.*) participants are in the Hearing Room")]
        public void ThenTheVHOCanSeeThatAllTheJudgeAndParticipantsAreInTheHearingRoom(string lastname)
        {
            SwitchToTheVhoIframe();
            var judgeId = _c.Test.Conference.Participants.First(x => x.User_role == UserRole.Judge).Id;
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AdminPanelPage.ParticipantInHearingRoom(judgeId)).Displayed.Should().BeTrue();
            var participantId = _c.Test.Conference.Participants.First(x => x.Name.ToLower().Contains(lastname.ToLower())).Id;
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(AdminPanelPage.ParticipantInHearingRoom(participantId)).Displayed.Should().BeTrue();
            SwitchToDefaultContent();
        }

        public void ProgressToNextPage()
        {
            WhenTheUserClicksClose();
        }

        private void SwitchToTheVhoIframe()
        {
            _browsers[_c.CurrentUser].Driver.SwitchTo().Frame(AdminPanelPage.AdminIframeId);
        }

        private void SwitchToDefaultContent()
        {
            _browsers[_c.CurrentUser].Driver.SwitchTo().DefaultContent();
        }
    }
}
