using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class SwitchOnCamAndMicPage
    {
        public SwitchOnCamAndMicPage()
        {
        }

        public By SwitchOnTitle => CommonLocators.ElementContainingText(SwitchOnTitleText);
        public By SuccessTitle => CommonLocators.ElementContainingText(SuccessHeadingText);
        public By SuccessMessage => CommonLocators.ElementContainingText(SuccessMessageText);
        public By UnsuccessfulTitle => CommonLocators.ElementContainingText(UnsuccessfulHeadingText);
        public By UnsuccessfulMessage => CommonLocators.ElementContainingText(UnsuccessfulMessageText);
        public By ContinueButton => CommonLocators.ButtonWithInnertext("Continue");

        private const string SwitchOnTitleText = "Use your camera and microphone";
        private const string SuccessHeadingText = "Your camera and microphone are switched on";
        private const string SuccessMessageText = "Your camera and microphone are switched on. You can now continue to the video.";
        private const string UnsuccessfulHeadingText = "Your camera and microphone are blocked";
        private const string UnsuccessfulMessageText = "We're sorry, you can't take part in the hearing without using your camera and microphone.";
    }
}
