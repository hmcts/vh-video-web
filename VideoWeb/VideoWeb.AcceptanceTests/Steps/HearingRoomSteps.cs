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
        private readonly ScenarioContext _scenario;
        private readonly HearingRoomPage _hearingRoomPage;
        private readonly WaitingRoomPage _waitingRoomPage;
        private readonly CommonPages _commonPages;

        public HearingRoomSteps(BrowserContext browserContext, ScenarioContext injectedContext,
            HearingRoomPage hearingRoomPage, WaitingRoomPage waitingRoomPage)
        {
            _browserContext = browserContext;
            _scenario = injectedContext;
            _hearingRoomPage = hearingRoomPage;
            _waitingRoomPage = waitingRoomPage;
        }

        [When(@"the countdown finishes")]
        public void WhenTheCountdownFinishes()
        {
        }

        [Then(@"the hearing controls are visible")]
        public void ThenTheHearingControlsAreVisible()
        {
            _browserContext.NgDriver.WaitUntilElementVisible(_hearingRoomPage.SideMenuArrow).Displayed.Should().BeTrue();
            _browserContext.NgDriver.WaitUntilElementVisible(_hearingRoomPage.RequestAssistance).Displayed.Should().BeTrue();
            _browserContext.NgDriver.WaitUntilElementVisible(_hearingRoomPage.PauseHearing).Displayed.Should().BeTrue();
            _browserContext.NgDriver.WaitUntilElementVisible(_hearingRoomPage.EndHearing).Displayed.Should().BeTrue();
            _browserContext.NgDriver.WaitUntilElementVisible(_hearingRoomPage.ToggleSelfview).Displayed.Should().BeTrue();
            _browserContext.NgDriver.WaitUntilElementVisible(_hearingRoomPage.MuteCamera).Displayed.Should().BeTrue();
            _browserContext.NgDriver.WaitUntilElementVisible(_hearingRoomPage.MuteMicrophone).Displayed.Should().BeTrue();
            _browserContext.NgDriver.WaitUntilElementVisible(_hearingRoomPage.Disconnect).Displayed.Should().BeTrue();
            _browserContext.NgDriver.WaitUntilElementVisible(_hearingRoomPage.ToggleFullscreen).Displayed.Should().BeTrue();
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