using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class WaitingRoomSteps
    {
        private readonly BrowserContext _browserContext;
        private readonly TestContext _context;
        private readonly WaitingRoomPage _waitingRoomPage;
        private readonly CommonPages _commonPageElements;

        public WaitingRoomSteps(BrowserContext browserContext, TestContext context,
            WaitingRoomPage waitingRoomPage, CommonPages commonPage)
        {
            _browserContext = browserContext;
            _context = context;
            _waitingRoomPage = waitingRoomPage;
            _commonPageElements = commonPage;
        }
    }
}
