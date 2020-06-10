using System;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Helpers
{
    public static class Scrolling
    {
        public static void ScrollToTheHearing(UserBrowser browser, Guid conferenceId)
        {
            browser.Driver.WaitUntilElementExists(VhoHearingListPage.CaseName(conferenceId));
            browser.ScrollTo(VhoHearingListPage.CaseName(conferenceId));
        }

        public static void ScrollToTheTopOfThePage(UserBrowser browser)
        {
            browser.ScrollToTheTopOfThePage();
        }
    }
}
