using System.Collections.Generic;
using System.Linq;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using Selenium.Axe;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using TestApi.Contract.Dtos;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class AccessibilitySteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<UserDto, UserBrowser> _browsers;

        public AccessibilitySteps(TestContext testContext, Dictionary<UserDto, UserBrowser> browsers)
        {
            _c = testContext;
            _browsers = browsers;
        }

        [Then(@"the page should be accessible")]
        public void ThenThePageShouldBeAccessible()
        {
            _browsers[_c.CurrentUser].Driver.WaitForPageToLoad();
            var axeResult = new AxeBuilder(_browsers[_c.CurrentUser].Driver).Analyze();
            UnacceptableViolations(axeResult.Violations).Should().BeEmpty();
        }

        [Then(@"the page should be accessible apart from a missing header")]
        public void ThenThePageShouldBeAccessibleApartFromAMissingHeader()
        {
            var axeResult = new AxeBuilder(_browsers[_c.CurrentUser].Driver).DisableRules("page-has-heading-one").Analyze();
            UnacceptableViolations(axeResult.Violations).Should().BeEmpty();
        }
        
        //disable and review these accessibility violations in #VIH-VIH-9546
        private static AxeResultItem[] UnacceptableViolations(AxeResultItem[] violations) 
            => violations.Where(e => e.Id != "color-contrast" || e.Impact == "minor").ToArray();
    }
}
