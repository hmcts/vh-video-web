using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class SwitchOnCamAndMicPage
    {
        public static By SwitchOnTitle => CommonLocators.ElementContainingText(SwitchOnTitleText);
        public static By SuccessTitle => CommonLocators.ElementContainingText(SuccessHeadingText);
        public static By SuccessMessage => CommonLocators.ElementContainingText(SuccessMessageText);
        public static By UnsuccessfulTitle => CommonLocators.ElementContainingText(UnsuccessfulHeadingText);
        public static By UnsuccessfulMessage => CommonLocators.ElementContainingText(UnsuccessfulMessageText);
        public static By ContinueButton => CommonLocators.ButtonWithInnertext("Continue");
        private const string SwitchOnTitleText = "Use your camera and microphone";
        private const string SuccessHeadingText = "Your camera and microphone are switched on";
        private const string SuccessMessageText = "Your camera and microphone are switched on. You can now continue to the video.";
        private const string UnsuccessfulHeadingText = "Your camera and microphone are blocked";
        private const string UnsuccessfulMessageText = "We're sorry, you can't take part in the hearing without using your camera and microphone.";
    }
}
