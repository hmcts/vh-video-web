using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Pages;
using TestContext = VideoWeb.AcceptanceTests.Helpers.TestContext;
using Selenium.Axe;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class CommonSteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<string, UserBrowser> _browsers;

        public CommonSteps(TestContext testContext, Dictionary<string, UserBrowser> browsers)
        {
            _c = testContext;
            _browsers = browsers;
        }

        [When(@"the user clicks the (.*) button")]
        public void WhenTheUserClicksTheButton(string label)
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(CommonLocators.ButtonWithInnertext(label)).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(CommonLocators.ButtonWithInnertext(label)).Click();
        }

        [When(@"the user selects the (.*) radiobutton")]
        public void WhenTheUserSelectsTheRadiobutton(string label)
        {            
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementExists(CommonLocators.RadioButtonWithLabel(label)).Click();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementExists(CommonLocators.RadioButtonWithLabel(label)).Selected.Should().BeTrue();
        }

        [When(@"the user clicks the (.*) link")]
        public void WhenTheUserClicksTheChangeCameraOrMicrophoneLink(string linkText)
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(CommonLocators.LinkWithText(linkText)).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(CommonLocators.LinkWithText(linkText)).Click();
        }

        [Then(@"contact us details are available")]
        public void ThenContactUsDetailsWillBeAvailable()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(CommonPages.ContactUsLink).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(CommonPages.ContactUsLink).Click();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(CommonPages.ContactUsPhone(_c.Test.CommonData.CommonOnScreenData.VhoPhone)).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(CommonPages.ContactUsEmail(_c.Test.CommonData.CommonOnScreenData.VhoEmail)).Displayed.Should().BeTrue();
        }

        [Then(@"a phone number for help is provided")]
        public void ThenAPhoneNumberForHelpIsProvided()
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(CommonPages.ContactUsPhone(_c.Test.CommonData.CommonOnScreenData.VhoPhone)).Displayed.Should().BeTrue();
        }

        [Then(@"the banner should (.*) displayed")]
        public void ThenTheBannerShouldNotBeDisplayed(string expected)
        {
            if (expected.ToLower().Equals("not be"))
            { 
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilElementNotVisible(CommonPages.BetaBanner).Should().BeTrue();
            }
            else
            {
                _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(CommonPages.BetaBanner).Displayed.Should().BeTrue();
            }
        }

        [Then(@"the (.*) error message appears")]
        public void ThenTheErrorMessageAppears(string errorText)
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(CommonLocators.ErrorMessage).Text.Replace("Error:", "").Should().Contain(errorText);
        }

        [Then(@"the (.*) button is disabled")]
        public void ThenTheButtonIsDisabled(string label)
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(CommonLocators.ButtonWithInnertext(label)).GetAttribute("class").Should().Contain("disabled");
        }

        [Then(@"the page should be accessible")]
        public void ThenThePageShouldBeAccessible()
        {
            var axeResult = new AxeBuilder(_browsers[_c.CurrentUser.Key].Driver)
                .DisableRules( // BUG: Once VIH-5174 bug is fixed, remove these exclusions
                    "region", // https://dequeuniversity.com/rules/axe/3.3/region?application=axeAPI
                    "landmark-one-main", // https://dequeuniversity.com/rules/axe/3.3/landmark-one-main?application=axeAPI
                    "landmark-no-duplicate-banner", // https://dequeuniversity.com/rules/axe/3.3/landmark-no-duplicate-banner?application=axeAPI
                    "landmark-no-duplicate-contentinfo", // https://dequeuniversity.com/rules/axe/3.3/landmark-no-duplicate-contentinfo?application=axeAPI
                    "page-has-heading-one", // https://dequeuniversity.com/rules/axe/3.3/page-has-heading-one?application=axeAPI
                    "landmark-unique") // https://dequeuniversity.com/rules/axe/3.3/landmark-unique?application=axeAPI
                .Analyze();
            axeResult.Violations.Should().BeEmpty();
        }
    }
}

