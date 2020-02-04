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
    public class EquipmentWorkingSteps : ISteps
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _c;
        private readonly CommonSteps _commonSteps;

        public EquipmentWorkingSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext, CommonSteps commonSteps)
        {
            _browsers = browsers;
            _c = testContext;
            _commonSteps = commonSteps;
        }

        public void ProgressToNextPage()
        {
            _commonSteps.WhenTheUserSelectsTheRadiobutton("Yes");
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(EquipmentWorkingPage.ContinueButton).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(EquipmentWorkingPage.ContinueButton).Click();
        }

        [When(@"the user says the camera is not working")]
        [When(@"the user says the microphone is not working")]
        [When(@"the user says the video is not working")]
        public void WhenTheUserSaysTheEquipmentIsNotWorking()
        {
            _commonSteps.WhenTheUserSelectsTheRadiobutton("No");
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(EquipmentWorkingPage.ContinueButton).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementClickable(EquipmentWorkingPage.ContinueButton).Click();
        }
    }
}
