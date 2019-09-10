using System;
using System.Collections.Generic;
using System.Net;
using System.Threading;
using FluentAssertions;
using OpenQA.Selenium.Support.Extensions;
using OpenQA.Selenium.Support.UI;
using TechTalk.SpecFlow;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Assertions;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.AcceptanceTests.Users;
using VideoWeb.Common.Helpers;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class PracticeVideoHearingSteps : ISteps
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _tc;
        private readonly PracticeVideoHearingPage _practiceVideoHearingPage;
        private readonly CommonSteps _commonSteps;
        private const int VideoFinishedPlayingTimeout = 120;
        private const int Retries = 10;
        private const int Delay = 3;
        private const int ExtraTimeoutToLoadVideoFromKinly = 60;

        public PracticeVideoHearingSteps(Dictionary<string, UserBrowser> browsers, TestContext tc,
            PracticeVideoHearingPage practiceVideoHearingPage, CommonSteps commonSteps)
        {
            _browsers = browsers;
            _tc = tc;
            _practiceVideoHearingPage = practiceVideoHearingPage;
            _commonSteps = commonSteps;
        }

        [When(@"the video has ended")]
        public void WhenTheVideoHasEnded()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementNotVisible(_practiceVideoHearingPage.IncomingVideo,
                VideoFinishedPlayingTimeout);
        }

        [Then(@"the choose your camera and microphone popup should appear")]
        public void ThenTheChooseYourCameraAndMicrophonePopupShouldAppear()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(
                _practiceVideoHearingPage.ChangeMicPopup).Displayed.Should().BeTrue();
        }

        [When(@"the user selects a new microphone")]
        public void WhenTheUserSelectsANewMicrophone()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementExists(_practiceVideoHearingPage.MicsList).Displayed.Should()
                .BeTrue();

            new VideoIsPlaying(_browsers[_tc.CurrentUser.Key]).Feed(_practiceVideoHearingPage.PreferredCameraVideo);

            var micOptions = new SelectElement(_browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementExists(_practiceVideoHearingPage.MicsList));
            var micOptionsCount = micOptions.Options.Count;
            micOptionsCount.Should().BeGreaterThan(1);
            micOptions.SelectByIndex(micOptionsCount -1);

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementClickable(_practiceVideoHearingPage.ChangeButton).Click();
        }

        [Then(@"the choose your camera and microphone popup should disappear")]
        public void ThenTheChooseYourCameraAndMicrophonePopupShouldDisappear()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementNotVisible(
                _practiceVideoHearingPage.ChangeMicPopup).Should().BeTrue();
        }

        [Then(@"the incoming and self video should be playing video")]
        public void ThenTheIncomingVideoShouldBePlaying()
        {
            new VideoIsPlaying(_browsers[_tc.CurrentUser.Key]).Feed(_practiceVideoHearingPage.IncomingVideo);
            new VideoIsPlaying(_browsers[_tc.CurrentUser.Key]).Feed(_practiceVideoHearingPage.SelfVideo);
        }

        [Then(@"the test score should be produced")]
        public void ThenTheTestScoreShouldBeProduced()
        {
            var endpoint = new VideoApiUriFactory().ParticipantsEndpoints;
            var participantId = _tc.Conference.Participants
                .Find(x => x.Display_name.ToLower().Equals(_tc.CurrentUser.Displayname.ToLower())).Id;
            _tc.Request = _tc.Get(endpoint.GetSelfTestScore(_tc.NewConferenceId, participantId));

            var found = false;
            for (var i = 0; i < Retries; i++)
            {
                _tc.Response = _tc.VideoApiClient().Execute(_tc.Request);
                if (_tc.Response.StatusCode.Equals(HttpStatusCode.OK))
                {
                    found = true;
                    break;
                }
                Thread.Sleep(TimeSpan.FromSeconds(Delay));
            }

            found.Should().BeTrue($"Expected the status code after {Retries * Delay} seconds to be OK, but found {_tc.Response.StatusCode}");
            var selfScore = ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<TestCallScoreResponse>(_tc.Response.Content);
            selfScore.Score.ToString().Should().ContainAny("Good", "Okay", "Bad");
        }

        [Then(@"the user can see contact details to help resolve the issues")]
        public void ThenTheUserCanSeeContactDetailsToHelpResolveTheIssues()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_practiceVideoHearingPage.ProblemsTitle)
                .Displayed.Should().BeTrue();

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_practiceVideoHearingPage.TellParticipantsText)
                .Displayed.Should().BeTrue();
        }

        public void ProgressToNextPage()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_practiceVideoHearingPage.IncomingVideo, ExtraTimeoutToLoadVideoFromKinly)
                .Displayed.Should().BeTrue();
            _browsers[_tc.CurrentUser.Key].Driver.ExecuteJavaScript("arguments[0].scrollIntoView(true);", _browsers[_tc.CurrentUser.Key].Driver.FindElement(CommonLocators.ButtonWithLabel("Continue")));
            _commonSteps.WhentheUserClicksTheButton("Continue");
        }
    }
}