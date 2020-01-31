using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class SwitchOnCamAndMicSteps : ISteps
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _c;
        private readonly CommonSteps _commonSteps;

        public SwitchOnCamAndMicSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext, CommonSteps commonSteps)
        {
            _browsers = browsers;
            _c = testContext;
            _commonSteps = commonSteps;
        }

        [Then(@"the camera and microphone turned on success message appears")]
        public void ThenAnErrorAppearsPromptingThemToTryAgain()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(SwitchOnCamAndMicPage.SuccessTitle).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(SwitchOnCamAndMicPage.SuccessMessage).Displayed.Should().BeTrue();
        }

        public void ProgressToNextPage()
        {
            _commonSteps.WhenTheUserClicksTheButton("Switch on");
            _commonSteps.WhenTheUserClicksTheButton("Watch video");
        }
    }
}
