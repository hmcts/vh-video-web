using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class PracticeVideoHearingPage
    {
        private const string PopupHeaderText = "Choose your camera and microphone";
        public By IncomingVideo = By.Id("incomingStream");
        public By SelfVideo = By.Id("outgoingStream");
        public By SoundMeter = By.Id("meter");
        public By TestScore = By.XPath("//p[contains(text(),'Test Score:')]/strong");
        public By WarningMessage => CommonLocators.WarningMessageAfterRadioButton("No");
        public By ReplayButton => CommonLocators.ButtonWithInnertext("Re-play the video message");
        public By ChangeMicPopup => CommonLocators.ElementContainingText(PopupHeaderText);
        public By MicsList = By.Id("available-mics-list");
        public By ChangeButton => CommonLocators.ButtonWithInnertext("Change");
        public By ProblemsTitle => CommonLocators.ElementContainingText("Problems with your equipment?");
        public By TellParticipantsText => CommonLocators.ElementContainingText("We'll tell the participants their hearing may be delayed");
        public By PreferredCameraVideo = By.Id("preferredCameraStream");
    }
}
