using System;
using System.Collections.Generic;
using System.Diagnostics;
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
    public sealed class HearingRoomSteps : ISteps
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _tc;
        private readonly HearingRoomPage _page;
        private readonly WaitingRoomPage _waitingRoomPage;
        private readonly CommonSteps _commonSteps;
        private const int CountdownDuration = 30;
        private const int ExtraTimeAfterTheCountdown = 30;
        private const int PauseCloseTransferDuration = 15;
        private const int ExtraTimeForPageToRefresh = 60;

        public HearingRoomSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext, HearingRoomPage page, 
            CommonSteps commonSteps, WaitingRoomPage waitingRoomPage)
        {
            _browsers = browsers;
            _tc = testContext;
            _page = page;
            _commonSteps = commonSteps;
            _waitingRoomPage = waitingRoomPage;
        }

        [When(@"the countdown finishes")]
        public void WhenTheCountdownFinishes()
        {
            Thread.Sleep(TimeSpan.FromSeconds(CountdownDuration));

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.JudgeIframe).Displayed.Should().BeTrue();
            _browsers[_tc.CurrentUser.Key].Driver.SwitchTo().Frame(HearingRoomPage.JudgeIframeId);

            new VideoIsPlaying(_browsers[_tc.CurrentUser.Key]).Feed(_page.ClerkIncomingVideo);

            Thread.Sleep(TimeSpan.FromSeconds(ExtraTimeAfterTheCountdown));
        }

        [When(@"the Clerk clicks pause")]
        public void WhenTheUserClicksPause()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementClickable(_page.PauseButton).Click();

            Thread.Sleep(TimeSpan.FromSeconds(PauseCloseTransferDuration));
        }

        [When(@"the Clerk clicks close")]
        public void WhenTheUserClicksClose()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementClickable(_page.CloseButton).Click();

            Thread.Sleep(TimeSpan.FromSeconds(PauseCloseTransferDuration));
        }

        [When(@"(.*) refreshes the waiting room page")]
        public void WhenIndividualSRefreshesTheWaitingRoomPage(string user)
        {
            _commonSteps.GivenInTheUsersBrowser(user);
            _browsers[_tc.CurrentUser.Key].Driver.Navigate().Refresh();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_waitingRoomPage.HearingCaseDetails, ExtraTimeForPageToRefresh).Text
                .Should().Contain(_tc.Hearing.Cases.First().Name);
        }

        [Then(@"the Clerk is on the Hearing Room page for (.*) seconds")]
        public void ThenTheUserIsOnTheHearingRoomPageForSeconds(int seconds)
        {
            Thread.Sleep(TimeSpan.FromSeconds(seconds));
        }

        [Then(@"the Clerk is on the Hearing Room page for (.*) minute")]
        [Then(@"the Clerk is on the Hearing Room page for (.*) minutes")]
        public void ThenTheUserIsOnTheHearingRoomPageForMinutes(int minutes)
        {
            if (_tc.RunningVideoWebLocally)
            {
                Thread.Sleep(TimeSpan.FromMinutes(minutes));
            }
            else
            {
                ClickOnThePageEvery20SecondsToKeepTheTestRunningInSaucelabs(minutes);
            }
        }

        private void ClickOnThePageEvery20SecondsToKeepTheTestRunningInSaucelabs(int timeoutInMinutes)
        {
            var timer = new Stopwatch();
            timer.Start();

            while (timer.Elapsed.Minutes <= TimeSpan.FromMinutes(timeoutInMinutes).Minutes)
            {
                Thread.Sleep(TimeSpan.FromSeconds(20));
                _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.ClerkIncomingVideo).Click();
            }

            timer.Stop();
        }

        [Then(@"the hearing controls are visible")]
        public void ThenTheHearingControlsAreVisible()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.ToggleSelfview).Displayed.Should().BeTrue();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.PauseButton).Displayed.Should().BeTrue();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.CloseButton).Displayed.Should().BeTrue();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.TechnicalIssues).Displayed.Should().BeTrue();
        }

        [Then(@"the user can see themselves and toggle the view off and on")]
        public void ThenTheUserCanSeeThemselvesAndToggleTheViewOffAndOn()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.SelfView).Displayed.Should().BeTrue();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.ToggleSelfview).Click();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementNotVisible(_page.SelfView).Should().BeTrue();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.ToggleSelfview).Click();
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.SelfView).Displayed.Should().BeTrue();
        }

        [Then(@"the participant is back in the hearing")]
        public void ThenTheParticipantIsBackInTheHearing()
        {
            new VideoIsPlaying(_browsers[_tc.CurrentUser.Key]).Feed(_page.ParticipantIncomingVideo);
        }

        [Then(@"(.*) can see the other participants")]
        public void ThenParticipantsCanSeeTheOtherParticipants(string user)
        {
            _commonSteps.GivenInTheUsersBrowser(user);

            if (user.ToLower().Equals("clerk"))
            {
                _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.JudgeIframe).Displayed.Should().BeTrue();
                _browsers[_tc.CurrentUser.Key].Driver.SwitchTo().Frame(HearingRoomPage.JudgeIframeId);
                new VideoIsPlaying(_browsers[_tc.CurrentUser.Key]).Feed(_page.ClerkIncomingVideo);
            }
            else
            {
                new VideoIsPlaying(_browsers[_tc.CurrentUser.Key]).Feed(_page.ParticipantIncomingVideo);
            }
        }

        public void ProgressToNextPage()
        {
            WhenTheUserClicksClose();
        }
    }
}