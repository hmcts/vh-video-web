using System;
using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class ClerkWaitingRoomPage
    {
        public static By ReturnToHearingRoomLink => By.XPath("//a[contains(text(),'Return to video hearing list')]");
        public static By ContactVho => CommonLocators.ElementContainingText("you must call the video hearings team ");
        public static By HearingTitle => By.XPath("//*[contains(text(),'case number')]//ancestor::td");
        public static By HearingDateTime => By.XPath("//span[contains(text(),'to')]/ancestor::td");
        public static By StartHearingText => CommonLocators.ElementContainingText("Start video hearing");
        public static By IsEveryoneConnectedText => CommonLocators.ElementContainingText("Is everyone connected?");
        public static By ParticipantStatus(Guid participantId) => By.XPath($"//div[@id='p-row-{participantId}']//label");
        public static By PausedText => CommonLocators.ElementContainingText("Hearing paused");
        public static By ResumeVideoCallButton => CommonLocators.ButtonWithInnertext("Resume video hearing");
        public static By StartVideoHearingButton => CommonLocators.ButtonWithInnertext("Start video hearing");
    }
}
