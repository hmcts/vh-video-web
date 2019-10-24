using System.Collections.Generic;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.AcceptanceTests.Users;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class SwitchOnCamAndMicSteps : ISteps
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _tc;
        private readonly SwitchOnCamAndMicPage _switchOnCamAndMicPage;
        private readonly CommonSteps _commonSteps;

        public SwitchOnCamAndMicSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext, 
            SwitchOnCamAndMicPage switchOnCamAndMicPage, CommonSteps commonSteps)
        {
            _browsers = browsers;
            _tc = testContext;
            _switchOnCamAndMicPage = switchOnCamAndMicPage;
            _commonSteps = commonSteps;
        }

        [Then(@"the camera and microphone turned on success message appears")]
        public void ThenAnErrorAppearsPromptingThemToTryAgain()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_switchOnCamAndMicPage.SuccessTitle)
                .Displayed.Should().BeTrue();

            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_switchOnCamAndMicPage.SuccessMessage)
                .Displayed.Should().BeTrue();
        }

        public void ProgressToNextPage()
        {
            _commonSteps.WhenTheUserClicksTheButton("Switch on");
            _commonSteps.WhenTheUserClicksTheButton("Watch video");
        }
    }
}
