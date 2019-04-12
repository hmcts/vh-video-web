using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class EquipmentCheckSteps
    {
        private readonly BrowserContext _browserContext;
        private readonly TestContext _context;
        private readonly EquipmentCheckPage _equipmentCheckPage;
        private readonly CommonPages _commonPageElements;

        public EquipmentCheckSteps(BrowserContext browserContext, TestContext context,
            EquipmentCheckPage equipmentCheckPage, CommonPages commonPage)
        {
            _browserContext = browserContext;
            _context = context;
            _equipmentCheckPage = equipmentCheckPage;
            _commonPageElements = commonPage;
        }
    }
}
