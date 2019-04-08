using FluentAssertions;
using OpenQA.Selenium;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class EquipmentCheckPage
    {
        private readonly BrowserContext _context;

        public EquipmentCheckPage(BrowserContext browserContext)
        {
            _context = browserContext;
        }
        
        public void EquipmentCheckUrl()
        {
            _context.Retry(() => _context.NgDriver.Url.Trim().Should().Contain("equipment-check"));
        }
    }
}
