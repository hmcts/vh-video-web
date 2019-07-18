using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class ClerkWaitingRoomPage : WaitingRoomPage
    {
        public By ReturnToHearingRoomLink => By.XPath("//a[contains(text(),'Return to video hearing list')]");
        public By ContactVho => CommonLocators.ElementContainingText("you must call the video hearings team ");
        public By HearingTitle => By.XPath("//*[contains(text(),'case number')]//ancestor::td");
        public By HearingDateTime => By.XPath("//span[contains(text(),'to')]/ancestor::td");
        public By StartHearingText => CommonLocators.ElementContainingText("Start this hearing");
        public By IsEveryoneConnectedText => CommonLocators.ElementContainingText("Is everyone connected?");
    }
}
