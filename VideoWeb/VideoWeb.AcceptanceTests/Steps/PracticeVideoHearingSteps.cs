using System;
using System.Net;
using System.Threading;
using FluentAssertions;
using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;
using TechTalk.SpecFlow;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.Common.Helpers;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class PracticeVideoHearingSteps
    {
        private readonly BrowserContext _browserContext;
        private readonly TestContext _context;
        private readonly PracticeVideoHearingPage _practiceVideoHearingPage;
        private const int VideoFinishedPlayingTimeout = 90;
        private const int Retries = 5;

        public PracticeVideoHearingSteps(BrowserContext browserContext, TestContext context,
            PracticeVideoHearingPage practiceVideoHearingPage)
        {
            _browserContext = browserContext;
            _context = context;
            _practiceVideoHearingPage = practiceVideoHearingPage;
        }

        [When(@"the video has ended")]
        public void WhenTheVideoHasEnded()
        {
            _browserContext.NgDriver.WaitUntilElementNotVisible(_practiceVideoHearingPage.IncomingVideo,
                VideoFinishedPlayingTimeout);
        }

        [Then(@"the choose your camera and microphone popup should appear")]
        public void ThenTheChooseYourCameraAndMicrophonePopupShouldAppear()
        {
            _browserContext.NgDriver.WaitUntilElementVisible(
                _practiceVideoHearingPage.ChangeMicPopup).Displayed.Should().BeTrue();
        }

        [When(@"the user selects a new microphone")]
        public void WhenTheUserSelectsANewMicrophone()
        {
            _browserContext.NgDriver.WaitUntilElementExists(_practiceVideoHearingPage.MicsList).Displayed.Should()
                .BeTrue();

            VideoIsPlaying(_practiceVideoHearingPage.PreferredCameraVideo);

            var micOptions = new SelectElement(_browserContext.NgDriver.WaitUntilElementExists(_practiceVideoHearingPage.MicsList));
            var micOptionsCount = micOptions.Options.Count;
            micOptionsCount.Should().BeGreaterThan(1);
            micOptions.SelectByIndex(micOptionsCount -1);

            _browserContext.NgDriver.WaitUntilElementClickable(_practiceVideoHearingPage.ChangeButton).Click();
        }

        [Then(@"the choose your camera and microphone popup should disappear")]
        public void ThenTheChooseYourCameraAndMicrophonePopupShouldDisappear()
        {
            _browserContext.NgDriver.WaitUntilElementNotVisible(
                _practiceVideoHearingPage.ChangeMicPopup).Should().BeTrue();
        }

        [Then(@"the incoming and self video should be playing video")]
        public void ThenTheIncomingVideoShouldBePlaying()
        {
            VideoIsPlaying(_practiceVideoHearingPage.IncomingVideo);
            VideoIsPlaying(_practiceVideoHearingPage.SelfVideo);
        }

        [Then(@"the test score should be produced")]
        public void ThenTheTestScoreShouldBeDisplayed()
        {
            var endpoint = new VideoWebParticipantsEndpoints();
            var participantId = _context.Conference.Participants
                .Find(x => x.Display_name.Equals(_context.CurrentUser.Displayname)).Id;
            _context.Request = _context.Get(endpoint.SelfTestResult(_context.NewConferenceId, participantId));

            var found = false;
            for (var i = 0; i < Retries; i++)
            {
                _context.Response = _context.VideoWebClient().Execute(_context.Request);
                if (_context.Response.StatusCode == HttpStatusCode.OK)
                {
                    found = true;
                    break;
                }
                Thread.Sleep(TimeSpan.FromSeconds(1));
            }

            found.Should().BeTrue();
            _context.Response.IsSuccessful.Should().Be(true);
            var selfScore = ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<TestCallScoreResponse>(_context.Response.Content);
            selfScore.Score.ToString().Should().ContainAny("Good", "Okay", "Bad");
        }

        [Then(@"the user can see contact details to help resolve the issues")]
        public void ThenTheUserCanSeeContactDetailsToHelpResolveTheIssues()
        {
            _browserContext.NgDriver.WaitUntilElementVisible(_practiceVideoHearingPage.ProblemsTitle).Displayed.Should()
                .BeTrue();

            _browserContext.NgDriver.WaitUntilElementVisible(_practiceVideoHearingPage.TellParticipantsText).Displayed.Should()
                .BeTrue();
        }

        private void VideoIsPlaying(By element)
        {
            _browserContext.NgDriver.WaitUntilElementVisible(element);

            var playing = false;

            for (var i = 1; i <= Retries; i++)
            {
                var currentTime = Convert.ToDouble(_browserContext.NgDriver.WaitUntilElementVisible(element)
                    .GetAttribute("currentTime"));
                if (currentTime > 0)
                {
                    playing = true;
                    break;
                }

                Thread.Sleep(TimeSpan.FromSeconds(1));
            }

            playing.Should().BeTrue();
        }
    }
}
