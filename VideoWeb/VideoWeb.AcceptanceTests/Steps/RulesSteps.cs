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
    public sealed class RulesSteps
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _tc;
        private readonly RulesPage _rulesPage;

        public RulesSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext, RulesPage rulesPage)
        {
            _browsers = browsers;
            _tc = testContext;
            _rulesPage = rulesPage;
        }

        [Then(@"the HMCTS Crest is visible")]
        public void ThenTheHMCTSCrestIsVisible()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilElementVisible(_rulesPage.HmctsLogo).Displayed
                .Should().BeTrue();
        }
    }
}
