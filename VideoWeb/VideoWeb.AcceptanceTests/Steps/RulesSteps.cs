using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class RulesSteps : ISteps
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _c;
        private readonly CommonSteps _commonSteps;

        public RulesSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext, CommonSteps commonSteps)
        {
            _browsers = browsers;
            _c = testContext;
            _commonSteps = commonSteps;
        }

        [Then(@"the HMCTS Crest is visible")]
        public void ThenTheHmctsCrestIsVisible()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(RulesPage.HmctsLogo).Displayed.Should().BeTrue();
        }

        public void ProgressToNextPage()
        {
            _commonSteps.WhenTheUserClicksTheButton("Continue");
        }
    }
}
