using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.PageObject.Helpers;
using AcceptanceTests.Common.PageObject.Pages;
using FluentAssertions;
using TechTalk.SpecFlow;
using TestContext = VideoWeb.AcceptanceTests.Helpers.TestContext;
using VideoWeb.Services.TestApi;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class CommonSteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<User, UserBrowser> _browsers;

        public CommonSteps(TestContext testContext, Dictionary<User, UserBrowser> browsers)
        {
            _c = testContext;
            _browsers = browsers;
        }

        [When(@"the user clicks the (.*) button")]
        public void WhenTheUserClicksTheButton(string label)
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(CommonLocators.ButtonWithInnerText(label)).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Click(CommonLocators.ButtonWithInnerText(label));
        }

        [When(@"the user selects the (.*) radiobutton")]
        public void WhenTheUserSelectsTheRadiobutton(string label)
        {            
            _browsers[_c.CurrentUser].ClickRadioButton(CommonLocators.RadioButtonWithLabel(label));
            _browsers[_c.CurrentUser].Driver.WaitUntilElementExists(CommonLocators.RadioButtonWithLabel(label)).Selected.Should().BeTrue();
        }

        [When(@"the user clicks the (.*) link")]
        public void WhenTheUserClicksTheChangeCameraOrMicrophoneLink(string linkText)
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(CommonLocators.LinkWithText(linkText)).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].ClickLink(CommonLocators.LinkWithText(linkText));
        }

        [Then(@"contact us details are available")]
        public void ThenContactUsDetailsWillBeAvailable()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(CommonPages.ContactUsLink).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].ClickLink(CommonPages.ContactUsLink);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(CommonPages.ContactUsPhone(_c.Test.CommonData.CommonOnScreenData.VhoPhone)).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(CommonPages.ContactUsEmail(_c.Test.CommonData.CommonOnScreenData.VhoEmail)).Displayed.Should().BeTrue();
        }

        [Then(@"a phone number for help is provided")]
        public void ThenAPhoneNumberForHelpIsProvided()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(CommonPages.ContactUsPhone(_c.Test.CommonData.CommonOnScreenData.VhoPhone)).Displayed.Should().BeTrue();
        }

        [Then(@"the banner should (.*) displayed")]
        public void ThenTheBannerShouldNotBeDisplayed(string expected)
        {
            if (expected.ToLower().Equals("not be"))
            { 
                _browsers[_c.CurrentUser].Driver.WaitUntilElementNotVisible(CommonPages.BetaBanner).Should().BeTrue();
            }
            else
            {
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(CommonPages.BetaBanner).Displayed.Should().BeTrue();
            }
        }

        [Then(@"the (.*) error message appears")]
        public void ThenTheErrorMessageAppears(string errorText)
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(CommonLocators.ErrorMessage).Text.Replace("Error:", "").Should().Contain(errorText);
        }

        [Then(@"the (.*) button is disabled")]
        public void ThenTheButtonIsDisabled(string label)
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(CommonLocators.ButtonWithInnerText(label)).GetAttribute("class").Should().Contain("disabled");
        }
    }
}

