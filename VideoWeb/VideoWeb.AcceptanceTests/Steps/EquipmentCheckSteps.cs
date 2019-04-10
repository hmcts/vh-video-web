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
    public sealed class EquipmentCheck
    {
        private readonly BrowserContext _browserContext;
        private readonly TestContext _context;
        private readonly EquipmentCheckPage _equipmentCheckPagePage;
        private readonly CommonPages _commonPageElements;

        public EquipmentCheck(BrowserContext browserContext, TestContext context,
            EquipmentCheckPage equipmentCheckPage, CommonPages commonPage)
        {
            _browserContext = browserContext;
            _context = context;
            _equipmentCheckPagePage = equipmentCheckPage;
            _commonPageElements = commonPage;
        }        

        [Then(@"the user is on the equipment check page")]
        public void ThenTheUserIsOnTheBlahPage()
        {
            _equipmentCheckPagePage.EquipmentCheckUrl();
            _browserContext.NgDriver.WaitUntilElementVisible(_commonPageElements.SignOutLink).Displayed.Should().BeTrue();
        }

    }
}
