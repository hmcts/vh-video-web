﻿using System;
using System.Collections.Generic;
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
    public sealed class HearingRoomSteps
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _tc;
        private readonly HearingRoomPage _page;
        private readonly CommonPages _commonPages;
        private const int CountdownDuration = 30;

        public HearingRoomSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext, HearingRoomPage page, CommonPages commonPages)
        {
            _browsers = browsers;
            _tc = testContext;
            _page = page;
            _commonPages = commonPages;
        }

        [When(@"the countdown finishes")]
        public void WhenTheCountdownFinishes()
        {
            Thread.Sleep(TimeSpan.FromSeconds(CountdownDuration));

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_page.JudgeIframe).Displayed.Should().BeTrue();
            _browsers[_tc.CurrentUser.Key].Driver.SwitchTo().Frame(HearingRoomPage.JudgeIframeId);

            new VideoIsPlaying(_browsers[_tc.CurrentUser.Key]).Feed(_page.IncomingVideo);
        }

        [When(@"the Clerk clicks pause")]
        public void WhenTheUserClicksPause()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementClickable(_page.PauseButton).Click();
        }

        [When(@"the Clerk clicks close")]
        public void WhenTheUserClicksClose()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementClickable(_page.CloseButton).Click();
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
            Thread.Sleep(TimeSpan.FromMinutes(minutes));
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
    }
}