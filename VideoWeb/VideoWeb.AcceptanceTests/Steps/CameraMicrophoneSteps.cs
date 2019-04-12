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
    public sealed class CameraMicrophoneSteps
    {
        private readonly BrowserContext _browserContext;
        private readonly TestContext _context;
        private readonly CameraMicrophonePage _cameraMicrophonePage;
        private readonly CommonPages _commonPageElements;

        public CameraMicrophoneSteps(BrowserContext browserContext, TestContext context,
            CameraMicrophonePage cameraMicrophonePage, CommonPages commonPage)
        {
            _browserContext = browserContext;
            _context = context;
            _cameraMicrophonePage = cameraMicrophonePage;
            _commonPageElements = commonPage;
        }        
    }
}
