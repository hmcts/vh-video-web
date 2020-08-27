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
    public sealed class DeclarationSteps : ISteps
    {
        private readonly Dictionary<User, UserBrowser> _browsers;
        private readonly TestContext _c;
        private readonly CommonSteps _commonSteps;

        public DeclarationSteps(Dictionary<User, UserBrowser> browsers, TestContext testContext, CommonSteps commonSteps)
        {
            _browsers = browsers;
            _c = testContext;
            _commonSteps = commonSteps;
        }

        [When(@"the user gives their consent")]
        public void WhenTheUserGivesTheirConsent()
        {
            _browsers[_c.CurrentUser].ClickCheckbox(DeclarationPage.ConsentCheckbox);        
        }

        [Then(@"an error appears stating that they must confirm")]
        public void ThenAnErrorAppearsStatingThatTheyMustConfirm()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(DeclarationPage.NoConsentWarningMessage).Displayed.Should().BeTrue();
        }

        public void ProgressToNextPage()
        {
            WhenTheUserGivesTheirConsent();
            _commonSteps.WhenTheUserClicksTheButton("Continue");
        }
    }
}
