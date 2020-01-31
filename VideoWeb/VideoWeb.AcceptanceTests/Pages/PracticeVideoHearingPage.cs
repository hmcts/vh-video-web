using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class PracticeVideoHearingPage
    {
        private const string PopupHeaderText = "Choose your camera and microphone";
        public static By IncomingVideo = By.Id("incomingStream");
        public static By SelfVideo = By.Id("outgoingStream");
        public static By SoundMeter = By.Id("meter");
        public static By TestScore = By.XPath("//p[contains(text(),'Test Score:')]/strong");
        public static By WarningMessage => CommonLocators.WarningMessageAfterRadioButton("No");
        public static By ReplayButton => CommonLocators.ButtonWithInnertext("Re-play the video message");
        public static By ChangeMicPopup => CommonLocators.ElementContainingText(PopupHeaderText);
        public static By MicsList = By.Id("available-mics-list");
        public static By ChangeButton => CommonLocators.ButtonWithInnertext("Change");
        public static By ProblemsTitle => CommonLocators.ElementContainingText("Problems with your equipment?");
        public static By PleaseCallTheVhoText => CommonLocators.ElementContainingText("Please call the video hearings team");
        public static By PreferredCameraVideo = By.Id("preferredCameraStream");
    }
}
