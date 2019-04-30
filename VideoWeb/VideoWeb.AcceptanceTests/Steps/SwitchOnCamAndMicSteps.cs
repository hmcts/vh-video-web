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

        [When(@"the user selects (.*) on the permissions notification")]
        public void WhenTheUserSelectsTheChromeBrowserPermissionsNotification(string choice)
        {
            _browserContext.NgDriver.WaitUntilElementVisible(_switchOnCamAndMicPage.SwitchOnTitle).Displayed
                .Should().BeTrue();
            TabSelectPermissions.AllowPermissions(choice.Equals("allow"), _browserContext.TargetBrowser);
        }

        [Then(@"the camera and microphone turned on success message appears")]
        public void ThenAnErrorAppearsPromptingThemToTryAgain()
        {
            _browserContext.NgDriver.WaitUntilElementVisible(_switchOnCamAndMicPage.SuccessTitle).Displayed
                .Should().BeTrue();
            _browserContext.NgDriver.WaitUntilElementVisible(_switchOnCamAndMicPage.SuccessMessage).Displayed
                .Should().BeTrue();
        }

        [Then(@"the camera and microphone are blocked message appears")]
        public void ThenTheCameraAndMicrophoneAreBlockedMessageAppears()
        {
            _browserContext.NgDriver.WaitUntilElementVisible(_switchOnCamAndMicPage.UnsuccessfulTitle).Displayed
                .Should().BeTrue();
            _browserContext.NgDriver.WaitUntilElementVisible(_switchOnCamAndMicPage.UnsuccessfulMessage).Displayed
                .Should().BeTrue();
        }

        [Then(@"the continue button is not displayed")]
        public void ThenTheContinueButtonIsNotDisplayed()
        {
            _browserContext.NgDriver.WaitUntilElementNotVisible(_switchOnCamAndMicPage.ContinueButton, 5)
                .Should().BeTrue();
        }


    }
}
