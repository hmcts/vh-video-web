using System.Collections.Generic;
using System.Linq;
using System.Net;
using AcceptanceTests.Common.Api.Helpers;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Enums;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Test.Helpers;
using FluentAssertions;
using OpenQA.Selenium.Support.UI;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.Services.TestApi;
using TestCallScoreResponse = VideoWeb.Services.Video.TestCallScoreResponse;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class PracticeVideoHearingSteps : ISteps
    {
        private const int ExtraTimeoutToLoadVideoFromKinly = 60;
        private const int VideoFinishedPlayingTimeout = 120;
        private readonly Dictionary<User, UserBrowser> _browsers;
        private readonly TestContext _c;

        public PracticeVideoHearingSteps(Dictionary<User, UserBrowser> browsers, TestContext c)
        {
            _browsers = browsers;
            _c = c;
        }

        [Given(@"the practice video hearing video has started")]
        public void ThePracticeVideoHearingVideoHasStarted()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(PracticeVideoHearingPage.IncomingVideo, ExtraTimeoutToLoadVideoFromKinly).Displayed.Should().BeTrue();
        }

        [When(@"the video has ended")]
        public void WhenTheVideoHasEnded()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilElementNotVisible(PracticeVideoHearingPage.IncomingVideo, VideoFinishedPlayingTimeout);
        }

        [When(@"the user changes the camera and microphone")]
        public void WhenTheUserChangesTheCameraAndMicrophone()
        {
            if (_c.VideoWebConfig.TestConfig.TargetBrowser == TargetBrowser.Firefox) return;
            _browsers[_c.CurrentUser].ClickLink(PracticeVideoHearingPage.ChangeCameraAndMicrophoneLink);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(PracticeVideoHearingPage.ChangeMicPopup).Displayed.Should().BeTrue();
            WhenTheUserSelectsANewMicrophone();
        }

        public void WhenTheUserSelectsANewMicrophone()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilElementExists(PracticeVideoHearingPage.MicsList).Displayed.Should().BeTrue();
            new VerifyVideoIsPlayingBuilder(_browsers[_c.CurrentUser]).Feed(PracticeVideoHearingPage.PreferredCameraVideo);
            var micOptions = new SelectElement(_browsers[_c.CurrentUser].Driver.WaitUntilElementExists(PracticeVideoHearingPage.MicsList));
            micOptions.Options.Count.Should().BeGreaterThan(1);
            micOptions.SelectByIndex(micOptions.Options.Count - 1);
            _browsers[_c.CurrentUser].Click(PracticeVideoHearingPage.ChangeButton);
        }

        [Then(@"the choose your camera and microphone popup should disappear")]
        public void ThenTheChooseYourCameraAndMicrophonePopupShouldDisappear()
        {
            if (_c.VideoWebConfig.TestConfig.TargetBrowser != TargetBrowser.Firefox)
                _browsers[_c.CurrentUser].Driver.WaitUntilElementNotVisible(PracticeVideoHearingPage.ChangeMicPopup).Should().BeTrue();
        }

        [Then(@"the incoming and self video should be playing video")]
        public void ThenTheIncomingVideoShouldBePlaying()
        {
            new VerifyVideoIsPlayingBuilder(_browsers[_c.CurrentUser]).Feed(PracticeVideoHearingPage.IncomingVideo);
            new VerifyVideoIsPlayingBuilder(_browsers[_c.CurrentUser]).Feed(PracticeVideoHearingPage.SelfVideo);
        }

        [Then(@"the test score should be produced")]
        public void ThenTheTestScoreShouldBeProduced()
        {
            var participantId = _c.Test.ConferenceParticipants.First(x => x.Display_name.ToLower().Equals(_c.CurrentUser.Display_name.ToLower())).Id;

            var response = _c.Apis.TestApi.PollForSelfTestScoreResponse(_c.Test.NewConferenceId, participantId);
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var selfScore = RequestHelper.Deserialise<TestCallScoreResponse>(response.Content);
            selfScore.Score.ToString().Should().ContainAny("Good", "Okay", "Bad");
        }

        [Then(@"the user can see contact details to help resolve the issues")]
        public void ThenTheUserCanSeeContactDetailsToHelpResolveTheIssues()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(PracticeVideoHearingPage.ProblemsTitle).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(PracticeVideoHearingPage.PleaseCallTheVhoText).Displayed.Should().BeTrue();
        }

        public void ProgressToNextPage()
        {
            ThePracticeVideoHearingVideoHasStarted();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(PracticeVideoHearingPage.ContinueButton);
            _browsers[_c.CurrentUser].ScrollTo(PracticeVideoHearingPage.ContinueButton);
            _browsers[_c.CurrentUser].Click(PracticeVideoHearingPage.ContinueButton);
        }
    }
}
