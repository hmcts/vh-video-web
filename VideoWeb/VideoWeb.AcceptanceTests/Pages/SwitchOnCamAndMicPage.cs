using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class SwitchOnCamAndMicPage
    {
        public SwitchOnCamAndMicPage()
        {
        }

        public By SuccessTitle => CommonLocators.ElementContainingText(SuccessHeadingText);
        public By SuccessMessage => CommonLocators.ElementContainingText(SuccessMessageText);

        public const string SuccessHeadingText = "Your camera and microphone are switched on";
        public const string SuccessMessageText = "Your camera and microphone are switched on. You can now continue to the video.";
    }
}
