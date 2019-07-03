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
    public sealed class CameraWorkingSteps
    {
        private readonly BrowserContext _browserContext;
        private readonly CameraWorkingPage _cameraWorkingPage;

        public CameraWorkingSteps(BrowserContext browserContext, CameraWorkingPage cameraWorkingPage)
        {
            _browserContext = browserContext;
            _cameraWorkingPage = cameraWorkingPage;
        }
    }
}
