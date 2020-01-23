using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Test.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Assertions;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class HearingRoomSteps : ISteps
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _c;
        private readonly BrowserSteps _browserSteps;
        private const int CountdownDuration = 30;
        private const int ExtraTimeAfterTheCountdown = 30;
        private const int PauseCloseTransferDuration = 15;
        private const int ExtraTimeForPageToRefresh = 60;

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
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingRoomPage.JudgeIframe).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.SwitchTo().Frame(HearingRoomPage.JudgeIframeId);
            new VerifyVideoIsPlayingBuilder(_browsers[_c.CurrentUser.Key]).Feed(HearingRoomPage.ClerkIncomingVideo);
            Thread.Sleep(TimeSpan.FromSeconds(ExtraTimeAfterTheCountdown));
        }

        [When(@"the Clerk clicks pause")]
        public void WhenTheUserClicksPause()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementClickable(HearingRoomPage.PauseButton).Click();

            Thread.Sleep(TimeSpan.FromSeconds(PauseCloseTransferDuration));
        }

        [When(@"the Clerk clicks close")]
        public void WhenTheUserClicksClose()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementClickable(HearingRoomPage.CloseButton).Click();

            Thread.Sleep(TimeSpan.FromSeconds(PauseCloseTransferDuration));
        }

        [When(@"(.*) refreshes the waiting room page")]
        public void WhenIndividualSRefreshesTheWaitingRoomPage(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);
            _browsers[_c.CurrentUser.Key].Driver.Navigate().Refresh();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(WaitingRoomPage.HearingCaseDetails, ExtraTimeForPageToRefresh).Text
                .Should().Contain(_c.Hearing.Cases.First().Name);
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
            if (_c.VideoWebConfig.VhServices.RunningVideoWebLocally)
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
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingRoomPage.ClerkIncomingVideo).Click();
            }

            timer.Stop();
        }

        [Then(@"the hearing controls are visible")]
        public void ThenTheHearingControlsAreVisible()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingRoomPage.ToggleSelfview).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingRoomPage.PauseButton).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingRoomPage.CloseButton).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingRoomPage.TechnicalIssues).Displayed.Should().BeTrue();
        }

        [Then(@"the user can see themselves and toggle the view off and on")]
        public void ThenTheUserCanSeeThemselvesAndToggleTheViewOffAndOn()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingRoomPage.SelfView).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingRoomPage.ToggleSelfview).Click();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementNotVisible(HearingRoomPage.SelfView).Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingRoomPage.ToggleSelfview).Click();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingRoomPage.SelfView).Displayed.Should().BeTrue();
        }

        [Then(@"the participant is back in the hearing")]
        public void ThenTheParticipantIsBackInTheHearing()
        {
            new VerifyVideoIsPlayingBuilder(_browsers[_c.CurrentUser.Key]).Feed(HearingRoomPage.ParticipantIncomingVideo);
        }

        [Then(@"(.*) can see the other participants")]
        public void ThenParticipantsCanSeeTheOtherParticipants(string user)
        {
            _browserSteps.GivenInTheUsersBrowser(user);

            if (user.ToLower().Equals("clerk"))
            {
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(HearingRoomPage.JudgeIframe).Displayed.Should().BeTrue();
                _browsers[_c.CurrentUser.Key].Driver.SwitchTo().Frame(HearingRoomPage.JudgeIframeId);
                new VerifyVideoIsPlayingBuilder(_browsers[_c.CurrentUser.Key]).Feed(HearingRoomPage.ClerkIncomingVideo);
            }
            else
            {
                new VerifyVideoIsPlayingBuilder(_browsers[_c.CurrentUser.Key]).Feed(HearingRoomPage.ParticipantIncomingVideo);
            }
        }

        public void ProgressToNextPage()
        {
            WhenTheUserClicksClose();
        }
    }
}