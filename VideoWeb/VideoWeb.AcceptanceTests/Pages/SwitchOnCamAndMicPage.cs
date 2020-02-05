using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class SwitchOnCamAndMicPage
    {
        public static By SuccessTitle = CommonLocators.ElementContainingText(SuccessHeadingText);
        public static By SuccessMessage = CommonLocators.ElementContainingText(SuccessMessageText);
        public static By SwitchOnButton = CommonLocators.ButtonWithInnertext("Switch on");
        public static By WatchTheVideoButton = CommonLocators.ButtonWithInnertext("Watch the video");
        private const string SuccessHeadingText = "Your camera and microphone are switched on";
        private const string SuccessMessageText = "Your camera and microphone are switched on. You can now continue to the video.";
    }
}
