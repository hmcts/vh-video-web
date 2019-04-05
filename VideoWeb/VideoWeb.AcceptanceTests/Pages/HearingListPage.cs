using FluentAssertions;
using VideoWeb.AcceptanceTests.Helpers;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class HearingListPage
    {
        private readonly BrowserContext _context;

        public HearingListPage(BrowserContext browserContext)
        {
            _context = browserContext;
        }

        public void HearingListUrl()
        {
            _context.Retry(() => _context.NgDriver.Url.Trim().Should().Contain("hearing-list"));
        }
    }
}
