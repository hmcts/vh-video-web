using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class DeclarationSteps
    {
        private readonly BrowserContext _browserContext;
        private readonly DeclarationPage _declarationPage;

        public DeclarationSteps(BrowserContext browserContext, DeclarationPage declarationPage)
        {
            _browserContext = browserContext;
            _declarationPage = declarationPage;
        }

        [When(@"the user gives their consent")]
        public void WhenTheUserGivesTheirConsent()
        {
            _browserContext.NgDriver.WaitUntilElementExists(_declarationPage.ConsentCheckbox).Click();           
        }

        [Then(@"an error appears stating that they must confirm")]
        public void ThenAnErrorAppearsStatingThatTheyMustConfirm()
        {
            _browserContext.NgDriver.WaitUntilElementVisible(_declarationPage.NoConsentWarningMessage).Displayed
                .Should().BeTrue();
        }
    }
}
