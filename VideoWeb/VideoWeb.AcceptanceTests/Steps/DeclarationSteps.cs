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
    public sealed class DeclarationSteps : ISteps
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _tc;
        private readonly DeclarationPage _declarationPage;
        private readonly CommonSteps _commonSteps;

        public DeclarationSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext, 
            DeclarationPage declarationPage, CommonSteps commonSteps)
        {
            _browsers = browsers;
            _tc = testContext;
            _declarationPage = declarationPage;
            _commonSteps = commonSteps;
        }

        [When(@"the user gives their consent")]
        public void WhenTheUserGivesTheirConsent()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementExists(_declarationPage.ConsentCheckbox).Click();           
        }

        [Then(@"an error appears stating that they must confirm")]
        public void ThenAnErrorAppearsStatingThatTheyMustConfirm()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_declarationPage.NoConsentWarningMessage).Displayed
                .Should().BeTrue();
        }

        public void ProgressToNextPage()
        {
            WhenTheUserGivesTheirConsent();
            _commonSteps.WhenTheUserClicksTheButton("Continue");
        }
    }
}
