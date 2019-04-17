using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class MicrophoneWorkingSteps
    {
        private readonly BrowserContext _browserContext;
        private readonly MicrophoneWorkingPage _microphoneWorkingPage;

        public MicrophoneWorkingSteps(BrowserContext browserContext, MicrophoneWorkingPage microphoneWorkingPage)
        {
            _browserContext = browserContext;
            _microphoneWorkingPage = microphoneWorkingPage;
        }

        [Then(@"an error appears prompting them to try the microphone again")]
        public void ThenAnErrorAppearsPromptingThemToTryAgain()
        {
            _browserContext.NgDriver.WaitUntilElementVisible(_microphoneWorkingPage.WarningMessage).Displayed
                .Should().BeTrue();
            _browserContext.NgDriver.WaitUntilElementVisible(_microphoneWorkingPage.WarningMessage).Text
                .Should().Contain(MicrophoneWorkingPage.WarningMessageText);
        }
    }
}
