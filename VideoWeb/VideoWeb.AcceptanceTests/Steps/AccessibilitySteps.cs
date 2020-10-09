using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Drivers;
using FluentAssertions;
using Selenium.Axe;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.Services.TestApi;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class AccessibilitySteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<User, UserBrowser> _browsers;

        public AccessibilitySteps(TestContext testContext, Dictionary<User, UserBrowser> browsers)
        {
            _c = testContext;
            _browsers = browsers;
        }

        [Then(@"the page should be accessible")]
        public void ThenThePageShouldBeAccessible()
        {
            var axeResult = new AxeBuilder(_browsers[_c.CurrentUser].Driver).Analyze();
            axeResult.Violations.Should().BeEmpty();
        }

        [Then(@"the page should be accessible apart from a missing header")]
        public void ThenThePageShouldBeAccessibleApartFromAMissingHeader()
        {
            var axeResult = new AxeBuilder(_browsers[_c.CurrentUser].Driver)
                .DisableRules("page-has-heading-one").Analyze();
            axeResult.Violations.Should().BeEmpty();
        }
    }
}
