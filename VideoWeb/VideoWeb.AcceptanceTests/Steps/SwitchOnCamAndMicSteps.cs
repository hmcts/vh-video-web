using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class SwitchOnCamAndMicSteps
    {
        private readonly BrowserContext _browserContext;
        private readonly SwitchOnCamAndMicPage _switchOnCamAndMicPage;

        public SwitchOnCamAndMicSteps(BrowserContext browserContext, SwitchOnCamAndMicPage switchOnCamAndMicPage)
        {
            _browserContext = browserContext;
            _switchOnCamAndMicPage = switchOnCamAndMicPage;
        }

        [Then(@"the camera and microphone turned on success message appears")]
        public void ThenAnErrorAppearsPromptingThemToTryAgain()
        {
            _browserContext.NgDriver.WaitUntilElementVisible(_switchOnCamAndMicPage.SuccessTitle).Displayed
                .Should().BeTrue();
            _browserContext.NgDriver.WaitUntilElementVisible(_switchOnCamAndMicPage.SuccessMessage).Displayed
                .Should().BeTrue();
        }
    }
}
