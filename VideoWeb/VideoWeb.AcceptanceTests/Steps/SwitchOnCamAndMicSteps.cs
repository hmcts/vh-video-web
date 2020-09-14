using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.Services.TestApi;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class SwitchOnCamAndMicSteps : ISteps
    {
        private readonly Dictionary<User, UserBrowser> _browsers;
        private readonly TestContext _c;

        public SwitchOnCamAndMicSteps(Dictionary<User, UserBrowser> browsers, TestContext testContext)
        {
            _browsers = browsers;
            _c = testContext;
        }

        [Then(@"the camera and microphone turned on success message appears")]
        public void ThenAnErrorAppearsPromptingThemToTryAgain()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(SwitchOnCamAndMicPage.SuccessTitle).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(SwitchOnCamAndMicPage.SuccessMessage).Displayed.Should().BeTrue();
        }

        public void ProgressToNextPage()
        {
            _browsers[_c.CurrentUser].Click(SwitchOnCamAndMicPage.SwitchOnButton);
            _browsers[_c.CurrentUser].Click(SwitchOnCamAndMicPage.WatchTheVideoButton);
        }
    }
}
