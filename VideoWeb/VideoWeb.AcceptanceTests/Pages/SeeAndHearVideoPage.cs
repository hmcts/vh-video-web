using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class SeeAndHearVideoPage
    {
        public SeeAndHearVideoPage()
        {
        }

        public By WarningMessage => CommonLocators.WarningMessageAfterRadioButton("No");

        public const string WarningMessageText =
            "Make sure your speakers are on and the volume is turned up. If you couldn't see the videos clearly, it could be because your internet connection is slow. Try moving to a different room and try checking your equipment again. If you're still having problems, contact us using the options below.";
    }
}
