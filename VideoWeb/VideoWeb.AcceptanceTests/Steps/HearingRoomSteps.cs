using System;
using System.Threading;
using FluentAssertions;
using Protractor;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class HearingRoomSteps
    {
        private readonly NgWebDriver _driver;
        private readonly HearingRoomPage _page;
        private readonly CommonPages _commonPages;
        private const int CountdownDuration = 30;

        public HearingRoomSteps(BrowserContext browser, HearingRoomPage page, CommonPages commonPages)
        {
            _driver = browser.NgDriver;
            _page = page;
            _commonPages = commonPages;
        }

        [When(@"the countdown finishes")]
        public void WhenTheCountdownFinishes()
        {
            Thread.Sleep(TimeSpan.FromSeconds(CountdownDuration));

            _driver.WaitUntilElementVisible(_page.JudgeIframe).Displayed.Should().BeTrue();
            _driver.SwitchTo().Frame(HearingRoomPage.JudgeIframeId);

            Convert.ToDouble(_driver.WaitUntilElementVisible(_page.IncomingVideo)
                .GetAttribute("currentTime")).Should().BeGreaterThan(0);
        }

        [When(@"the user clicks pause")]
        public void WhenTheUserClicksPause()
        {
            _driver.WaitUntilElementClickable(_page.PauseButton).Click();
        }

        [Then(@"the user resumes the hearing")]
        public void ThenTheUserResumesTheHearing()
        {
            ScenarioContext.Current.Pending();
        }

        [Then(@"the user is on the Hearing Room page for (.*) seconds")]
        public void ThenTheUserIsOnTheHearingRoomPageForSeconds(int seconds)
        {
            _commonPages.PageUrl(Page.HearingRoom);
            Thread.Sleep(TimeSpan.FromSeconds(seconds));
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
            _driver.WaitUntilElementVisible(_page.ToggleSelfview).Displayed.Should().BeTrue();
            _driver.WaitUntilElementVisible(_page.PauseButton).Displayed.Should().BeTrue();
            _driver.WaitUntilElementVisible(_page.CloseButton).Displayed.Should().BeTrue();
            _driver.WaitUntilElementVisible(_page.TechnicalIssues).Displayed.Should().BeTrue();
        }

        [Then(@"the user can see themselves and toggle the view off and on")]
        public void ThenTheUserCanSeeThemselvesAndToggleTheViewOffAndOn()
        {
            _driver.WaitUntilElementVisible(_page.SelfView).Displayed.Should().BeTrue();
            _driver.WaitUntilElementVisible(_page.ToggleSelfview).Click();
            _driver.WaitUntilElementNotVisible(_page.SelfView).Should().BeTrue();
            _driver.WaitUntilElementVisible(_page.ToggleSelfview).Click();
            _driver.WaitUntilElementVisible(_page.SelfView).Displayed.Should().BeTrue();
        }
    }
}