using AcceptanceTests.Common.PageObject.Helpers;
using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class PracticeVideoHearingPage
    {
        private const string PopupHeaderText = "Choose your camera and microphone";
        public static By IncomingVideo = By.Id("incomingStream");
        public static By SelfVideo = By.Id("outgoingStream");
        public static By TestScore = By.XPath("//p[contains(text(),'Test Score:')]/strong");
        public static By ChangeMicPopup = CommonLocators.ElementContainingText(PopupHeaderText);
        public static By ChangeCameraAndMicrophoneLink = CommonLocators.LinkWithText("Change camera or microphone");
        public static By MicsList = By.Id("available-mics-list");
        public static By ChangeButton = CommonLocators.ButtonWithInnerText("Change");
        public static By ProblemsTitle = CommonLocators.ElementContainingText("Problems with your equipment?");
        public static By PleaseCallTheVhoText = CommonLocators.ElementContainingText("Please call the video hearings team");
        public static By PreferredCameraVideo = By.Id("preferredCameraStream");
        public static By SkipLink = By.Id("continue-link");
    }
}
