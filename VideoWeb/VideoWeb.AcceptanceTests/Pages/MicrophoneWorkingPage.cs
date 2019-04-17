using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class MicrophoneWorkingPage
    {
        public MicrophoneWorkingPage()
        {
        }

        public By WarningMessage => CommonLocators.WarningMessageAfterRadioButton("No");

        public const string WarningMessageText =
            "Make sure the microphone is switched on and try checking your equipment again. If you're still having problems, contact us using the options below.";
    }
}
