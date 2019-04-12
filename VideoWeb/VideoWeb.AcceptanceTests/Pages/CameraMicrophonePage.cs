using VideoWeb.AcceptanceTests.Contexts;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class CameraMicrophonePage
    {
        private readonly BrowserContext _context;

        public CameraMicrophonePage(BrowserContext browserContext)
        {
            _context = browserContext;
        }      
    }
}
