using System;
using System.Threading;
using FluentAssertions;
using OpenQA.Selenium;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class PracticeVideoHearingSteps
    {
        private readonly BrowserContext _browserContext;
        private readonly PracticeVideoHearingPage _practiceVideoHearingPage;
        private const int VideoFinishedPlayingTimeout = 90;
        private const int Retries = 5;

        public PracticeVideoHearingSteps(BrowserContext browserContext,
            PracticeVideoHearingPage practiceVideoHearingPage)
        {
            _browserContext = browserContext;
            _practiceVideoHearingPage = practiceVideoHearingPage;
        }

        [When(@"the video has ended")]
        public void WhenTheVideoHasEnded()
        {
            _browserContext.NgDriver.WaitUntilElementNotVisible(_practiceVideoHearingPage.IncomingVideo,
                VideoFinishedPlayingTimeout);
        }

        [Then(@"the incoming and self video should be playing video")]
        public void ThenTheIncomingVideoShouldBePlaying()
        {
            VideoIsPlaying(_practiceVideoHearingPage.IncomingVideo);
            VideoIsPlaying(_practiceVideoHearingPage.SelfVideo);
        }

        [Then(@"the test score should be displayed")]
        public void ThenTheTestScoreShouldBeDisplayed()
        {
            var selfScore = _browserContext.NgDriver.WaitUntilElementVisible(_practiceVideoHearingPage.TestScore).Text;
            selfScore.Should().ContainAny("Good", "Okay", "Bad");
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
