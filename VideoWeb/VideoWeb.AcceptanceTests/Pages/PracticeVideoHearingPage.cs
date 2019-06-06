using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class PracticeVideoHearingPage
    {
        public By IncomingVideo = By.Id("incomingStream");
        public By SelfVideo = By.Id("outgoingStream");
        public By SoundMeter = By.Id("meter");
        public By TestScore = By.XPath("//p[contains(text(),'Test Score:')]/strong");
        public By WarningMessage => CommonLocators.WarningMessageAfterRadioButton("No");
        public By ReplayButton => CommonLocators.ButtonWithLabel("Re-play the video message");
    }
}
