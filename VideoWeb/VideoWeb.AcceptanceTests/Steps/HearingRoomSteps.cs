using System;
using System.Threading;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class HearingRoomSteps
    {
        private readonly BrowserContext _browserContext;
        private readonly HearingRoomPage _hearingRoomPage;
        private readonly CommonPages _commonPages;
        private const int CountdownDuration = 30;

        public HearingRoomSteps(BrowserContext browserContext, HearingRoomPage hearingRoomPage, CommonPages commonPages)
        {
            _browserContext = browserContext;
            _hearingRoomPage = hearingRoomPage;
            _commonPages = commonPages;
        }

        [When(@"the countdown finishes")]
        public void WhenTheCountdownFinishes()
        {
            Thread.Sleep(TimeSpan.FromSeconds(CountdownDuration));

            _browserContext.NgDriver.WaitUntilElementVisible(_hearingRoomPage.JudgeIframe).Displayed.Should().BeTrue();
            _browserContext.NgDriver.SwitchTo().Frame(HearingRoomPage.JudgeIframeId);

            Convert.ToDouble(_browserContext.NgDriver.WaitUntilElementVisible(_hearingRoomPage.IncomingVideo)
                .GetAttribute("currentTime")).Should().BeGreaterThan(0);
        }

        [Then(@"the user is on the Hearing Room page for (.*) minute")]
        [Then(@"the user is on the Hearing Room page for (.*) minutes")]
        public void ThenTheUserIsOnTheHearingRoomPageForMinutes(int minutes)
        {
            _commonPages.PageUrl(Page.HearingRoom);
            Thread.Sleep(TimeSpan.FromMinutes(minutes));
        }

        [Then(@"the hearing controls are visible")]
        public void ThenTheHearingControlsAreVisible()
        {
            _browserContext.NgDriver.WaitUntilElementVisible(_hearingRoomPage.ToggleSelfview).Displayed.Should().BeTrue();
            _browserContext.NgDriver.WaitUntilElementVisible(_hearingRoomPage.PauseButton).Displayed.Should().BeTrue();
            _browserContext.NgDriver.WaitUntilElementVisible(_hearingRoomPage.CloseButton).Displayed.Should().BeTrue();
            _browserContext.NgDriver.WaitUntilElementVisible(_hearingRoomPage.TechnicalIssues).Displayed.Should().BeTrue();
        }

        [Then(@"the user can see themselves and toggle the view off and on")]
        public void ThenTheUserCanSeeThemselvesAndToggleTheViewOffAndOn()
        {
            _browserContext.NgDriver.WaitUntilElementVisible(_hearingRoomPage.SelfView).Displayed.Should().BeTrue();
            _browserContext.NgDriver.WaitUntilElementVisible(_hearingRoomPage.ToggleSelfview).Click();
            _browserContext.NgDriver.WaitUntilElementNotVisible(_hearingRoomPage.SelfView).Should().BeTrue();
            _browserContext.NgDriver.WaitUntilElementVisible(_hearingRoomPage.ToggleSelfview).Click();
            _browserContext.NgDriver.WaitUntilElementVisible(_hearingRoomPage.SelfView).Displayed.Should().BeTrue();
        }
    }
}