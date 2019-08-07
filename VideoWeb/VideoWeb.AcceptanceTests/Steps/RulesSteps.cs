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
    public sealed class RulesSteps : ISteps
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _tc;
        private readonly RulesPage _rulesPage;
        private readonly CommonSteps _commonSteps;

        public RulesSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext, RulesPage rulesPage, CommonSteps commonSteps)
        {
            _browsers = browsers;
            _tc = testContext;
            _rulesPage = rulesPage;
            _commonSteps = commonSteps;
        }

        [Then(@"the HMCTS Crest is visible")]
        public void ThenTheHmctsCrestIsVisible()
        {
            _browsers[_tc.CurrentUser.Key].Driver.WaitUntilVisible(_rulesPage.HmctsLogo).Displayed
                .Should().BeTrue();
        }

        public void ProgressToNextPage()
        {
            _commonSteps.WhentheUserClicksTheButton("Continue");
        }
    }
}
