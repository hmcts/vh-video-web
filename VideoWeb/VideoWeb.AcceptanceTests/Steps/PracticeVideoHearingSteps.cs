using System.Collections.Generic;
using System.Net;
using AcceptanceTests.Common.Api.Hearings;
using AcceptanceTests.Common.Api.Requests;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Test.Helpers;
using FluentAssertions;
using OpenQA.Selenium.Support.Extensions;
using OpenQA.Selenium.Support.UI;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class PracticeVideoHearingSteps : ISteps
    {
        private const int ExtraTimeoutToLoadVideoFromKinly = 60;
        private const int VideoFinishedPlayingTimeout = 120;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _c;
        private readonly CommonSteps _commonSteps;

        public PracticeVideoHearingSteps(Dictionary<string, UserBrowser> browsers, TestContext c, CommonSteps commonSteps)
        {
            _browsers = browsers;
            _c = c;
            _commonSteps = commonSteps;
        }

        [When(@"the video has ended")]
        public void WhenTheVideoHasEnded()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementNotVisible(PracticeVideoHearingPage.IncomingVideo, VideoFinishedPlayingTimeout);
        }

        [Then(@"the choose your camera and microphone popup should appear")]
        public void ThenTheChooseYourCameraAndMicrophonePopupShouldAppear()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(PracticeVideoHearingPage.ChangeMicPopup).Displayed.Should().BeTrue();
        }

        [When(@"the user selects a new microphone")]
        public void WhenTheUserSelectsANewMicrophone()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementExists(PracticeVideoHearingPage.MicsList).Displayed.Should().BeTrue();
            new VerifyVideoIsPlayingBuilder(_browsers[_c.CurrentUser.Key]).Feed(PracticeVideoHearingPage.PreferredCameraVideo);
            var micOptions = new SelectElement(_browsers[_c.CurrentUser.Key].Driver.WaitUntilElementExists(PracticeVideoHearingPage.MicsList));
            micOptions.Options.Count.Should().BeGreaterThan(1);
            micOptions.SelectByIndex(micOptions.Options.Count - 1);
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementClickable(PracticeVideoHearingPage.ChangeButton).Click();
        }

        [Then(@"the choose your camera and microphone popup should disappear")]
        public void ThenTheChooseYourCameraAndMicrophonePopupShouldDisappear()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementNotVisible(PracticeVideoHearingPage.ChangeMicPopup).Should().BeTrue();
        }

        [Then(@"the incoming and self video should be playing video")]
        public void ThenTheIncomingVideoShouldBePlaying()
        {
            new VerifyVideoIsPlayingBuilder(_browsers[_c.CurrentUser.Key]).Feed(PracticeVideoHearingPage.IncomingVideo);
            new VerifyVideoIsPlayingBuilder(_browsers[_c.CurrentUser.Key]).Feed(PracticeVideoHearingPage.SelfVideo);
        }

        [Then(@"the test score should be produced")]
        public void ThenTheTestScoreShouldBeProduced()
        {
            var participantId = _c.Conference.Participants.Find(x => x.Display_name.ToLower().Equals(_c.CurrentUser.DisplayName.ToLower())).Id;
            var videoApiManager = new VideoApiManager(_c.VideoWebConfig.VhServices.VideoApiUrl, _c.Tokens.VideoApiBearerToken);
            var response = videoApiManager.PollForSelfTestScoreResponse(_c.Test.NewConferenceId, participantId);
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var selfScore = RequestHelper.DeserialiseSnakeCaseJsonToResponse<TestCallScoreResponse>(response.Content);
            selfScore.Score.ToString().Should().ContainAny("Good", "Okay", "Bad");
        }

        [Then(@"the user can see contact details to help resolve the issues")]
        public void ThenTheUserCanSeeContactDetailsToHelpResolveTheIssues()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(PracticeVideoHearingPage.ProblemsTitle).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(PracticeVideoHearingPage.PleaseCallTheVhoText).Displayed.Should().BeTrue();
        }

        public void ProgressToNextPage()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(PracticeVideoHearingPage.IncomingVideo, ExtraTimeoutToLoadVideoFromKinly).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.ExecuteJavaScript("arguments[0].scrollIntoView(true);", _browsers[_c.CurrentUser.Key].Driver.FindElement(CommonLocators.ButtonWithInnertext("Continue")));
            _commonSteps.WhenTheUserClicksTheButton("Continue");
        }
    }
}