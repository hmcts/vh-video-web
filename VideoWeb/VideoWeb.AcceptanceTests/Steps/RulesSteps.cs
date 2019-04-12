using System;
using System.Linq;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class RulesSteps
    {
        private readonly BrowserContext _browserContext;
        private readonly RulesPage _rulesPage;

        public RulesSteps(BrowserContext browserContext, RulesPage rulesPage)
        {
            _browserContext = browserContext;
            _rulesPage = rulesPage;
        }

        [Then(@"the HMCTS Crest is visible")]
        public void ThenTheHMCTSCrestIsVisible()
        {
            _browserContext.NgDriver.WaitUntilElementVisible(_rulesPage.HmctsLogo).Displayed
                .Should().BeTrue();
        }
    }
}
