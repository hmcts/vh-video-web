using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using AcceptanceTests.Common.Api.Helpers;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Driver.Support;
using AcceptanceTests.Common.Test.Helpers;
using FluentAssertions;
using OpenQA.Selenium;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.Services.Video;
using AudioRecordingResponse = VideoWeb.Services.Video.AudioRecordingResponse;


namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class HearingRoomSteps : ISteps
    {
        private const int CountdownDuration = 30;
        private const int ExtraTimeAfterTheCountdown = 30;
        private const int PauseCloseTransferDuration = 15;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _c;
        private readonly BrowserSteps _browserSteps;

        public HearingRoomSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext, BrowserSteps browserSteps)
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
            SwitchToTheJudgeIFrame();
            new VerifyVideoIsPlayingBuilder(_browsers[_c.CurrentUser.Key]).Feed(HearingRoomPage.ClerkIncomingVideo);
        }

        [When(@"the Clerk clicks pause")]
        public void WhenTheUserClicksPause()
        {
            if (_c.VideoWebConfig.TestConfig.TargetBrowser != TargetBrowser.Firefox &&
                _c.VideoWebConfig.TestConfig.TargetBrowser != TargetBrowser.MacFirefox)
            {
                SwitchToTheJudgeIFrame();
            }

            _browsers[_c.CurrentUser.Key].Click(HearingRoomPage.PauseButton);
            Thread.Sleep(TimeSpan.FromSeconds(PauseCloseTransferDuration));
            _c.Test.JudgeInIframe = false;
        }

        [When(@"the Clerk clicks close")]
        public void WhenTheUserClicksClose()
        {
            if (_c.VideoWebConfig.TestConfig.TargetBrowser != TargetBrowser.Firefox &&
                _c.VideoWebConfig.TestConfig.TargetBrowser != TargetBrowser.MacFirefox)
            {
                SwitchToTheJudgeIFrame();
            }
            
            _browsers[_c.CurrentUser.Key].Click(HearingRoomPage.CloseButton);
            Thread.Sleep(TimeSpan.FromSeconds(PauseCloseTransferDuration));
            _c.Test.JudgeInIframe = false;
        }

        [When(@"the Clerk is on the Hearing Room page for (.*) seconds")]
        [Then(@"the Clerk is on the Hearing Room page for (.*) seconds")]
        public void ThenTheUserIsOnTheHearingRoomPageForSeconds(int seconds)
        {
            Thread.Sleep(TimeSpan.FromSeconds(seconds));
        }

        [Then(@"the Clerk is on the Hearing Room page for (.*) minute")]
        [Then(@"the Clerk is on the Hearing Room page for (.*) minutes")]
        [Then(@"the participant is on the Hearing Room page for (.*) minute")]
        [Then(@"the participant is on the Hearing Room page for (.*) minutes")]
        public void ThenTheUserIsOnTheHearingRoomPageForMinutes(int minutes)
        {
            Thread.Sleep(TimeSpan.FromMinutes(minutes));
        }

        [Then(@"the hearing controls are visible")]
        public void ThenTheHearingControlsAreVisible()
        {
            SwitchToTheJudgeIFrame();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingRoomPage.ToggleSelfView).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingRoomPage.PauseButton).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingRoomPage.CloseButton).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingRoomPage.TechnicalIssues).Displayed.Should().BeTrue();
        }

        [Then(@"the user can see themselves and toggle the view off and on")]
        public void ThenTheUserCanSeeThemselvesAndToggleTheViewOffAndOn()
        {
            SwitchToTheJudgeIFrame();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingRoomPage.SelfView).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Click(HearingRoomPage.ToggleSelfView);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementNotVisible(HearingRoomPage.SelfView).Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Click(HearingRoomPage.ToggleSelfView);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingRoomPage.SelfView).Displayed.Should().BeTrue();
        }

        [Then(@"the participant is back in the hearing")]
        public void ThenTheParticipantIsBackInTheHearing()
        {
            SwitchToParticipantContent();
            new VerifyVideoIsPlayingBuilder(_browsers[_c.CurrentUser.Key]).Feed(HearingRoomPage.ParticipantIncomingVideo);
        }

        [Then(@"the Clerk can see the participants")]
        public void ThenTheClerkCanSeeTheOtherParticipants()
        {
            SwitchToTheJudgeIFrame();
            new VerifyVideoIsPlayingBuilder(_browsers[_c.CurrentUser.Key]).Feed(HearingRoomPage.ClerkIncomingVideo);
        }

        [Then(@"(.*) can see the other participants")]
        public void ThenParticipantsCanSeeTheOtherParticipants(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            SwitchToParticipantContent();
            new VerifyVideoIsPlayingBuilder(_browsers[_c.CurrentUser.Key]).Feed(HearingRoomPage.ParticipantIncomingVideo);
        }

        [Then(@"an audio recording of the hearing has been created")]
        public void ThenAnAudioRecordingOfTheHearingHasBeenCreated()
        {
            var response = _c.Apis.VideoApi.GetAudioRecordingLink(_c.Test.NewHearingId);
            var audioLink = RequestHelper.DeserialiseSnakeCaseJsonToResponse<AudioRecordingResponse>(response.Content);
            audioLink.Should().NotBeNull();
            audioLink.Audio_file_link.ToLower().Should().Contain(_c.Test.NewHearingId.ToString().ToLower());
        }

        [Then(@"the VHO can see that (.*) is in the Waiting Room")]
        public void ThenTheVHOCanSeeThatAllTheParticipantsAreInTheWaitingRoom(string lastname)
        {
            SwitchToTheVhoIframe();
            var participantId = _c.Test.Conference.Participants.First(x => x.Name.ToLower().Contains(lastname.ToLower())).Id;
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(AdminPanelPage.ParticipantInWaitingRoom(participantId)).Displayed.Should().BeTrue();
            SwitchToDefaultContent();
        }

        [Then(@"the VHO can see that the Judge and (.*) participants are in the Hearing Room")]
        public void ThenTheVHOCanSeeThatAllTheParticipantsAreInTheHearingRoom(string lastname)
        {
            SwitchToTheVhoIframe();
            var judgeId = _c.Test.Conference.Participants.First(x => x.User_role == UserRole.Judge).Id;
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(AdminPanelPage.ParticipantInHearingRoom(judgeId)).Displayed.Should().BeTrue();
            var participantId = _c.Test.Conference.Participants.First(x => x.Name.ToLower().Contains(lastname.ToLower())).Id;
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(AdminPanelPage.ParticipantInHearingRoom(participantId)).Displayed.Should().BeTrue();
            SwitchToDefaultContent();
        }

        public void ProgressToNextPage()
        {
            SwitchToTheJudgeIFrame();
            WhenTheUserClicksClose();
        }

        private void SwitchToTheJudgeIFrame()
        {
            if (_c.Test.JudgeInIframe) return;
            if (!_browsers[_c.CurrentUser.Key].IsDisplayed(By.Id(HearingRoomPage.JudgeIframeId))) return;
            _browsers[_c.CurrentUser.Key].Driver.SwitchTo().Frame(HearingRoomPage.JudgeIframeId);
            _c.Test.JudgeInIframe = true;
        }

        private void SwitchToTheVhoIframe()
        {
            _browsers[_c.CurrentUser.Key].Driver.SwitchTo().Frame(AdminPanelPage.AdminIframeId);
        }

        private void SwitchToParticipantContent()
        {
            if (!_browsers[_c.CurrentUser.Key].IsDisplayed(HearingRoomPage.ParticipantIncomingVideo))
            {
                SwitchToDefaultContent();
            }
        }

        private void SwitchToDefaultContent()
        {
            _browsers[_c.CurrentUser.Key].Driver.SwitchTo().DefaultContent();
        }
    }
}
