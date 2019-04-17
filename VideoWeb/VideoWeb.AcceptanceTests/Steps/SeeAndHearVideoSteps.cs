using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class SeeAndHearVideoSteps
    {
        private readonly BrowserContext _browserContext;
        private readonly SeeAndHearVideoPage _seeAndHearVideoPage;

        public SeeAndHearVideoSteps(BrowserContext browserContext, SeeAndHearVideoPage seeAndHearVideoPage)
        {
            _browserContext = browserContext;
            _seeAndHearVideoPage = seeAndHearVideoPage;
        }

        [Then(@"an error appears prompting them to try the equipment again")]
        public void ThenAnErrorAppearsPromptingThemToTryAgain()
        {
            _browserContext.NgDriver.WaitUntilElementVisible(_seeAndHearVideoPage.WarningMessage).Displayed
                .Should().BeTrue();
            _browserContext.NgDriver.WaitUntilElementVisible(_seeAndHearVideoPage.WarningMessage).Text
                .Should().Contain(SeeAndHearVideoPage.WarningMessageText);
        }
    }
}
