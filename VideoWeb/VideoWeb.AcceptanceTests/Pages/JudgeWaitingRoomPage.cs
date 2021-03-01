using AcceptanceTests.Common.PageObject.Helpers;
using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class JudgeWaitingRoomPage
    {
        public static readonly By ReturnToHearingRoomLink = By.XPath("//a[contains(text(),'Return to video hearing list')]");
        public static readonly By ContactVho = CommonLocators.ElementContainingText("you must call the video hearings team ");
        public static readonly By HearingTitle = By.XPath("//*[contains(text(),'case number')]//ancestor::td");
        public static readonly By HearingDateTime = By.XPath("//span[contains(text(),'to')]/ancestor::td");
        public static readonly By StartHearingText = CommonLocators.ElementContainingText("Start video hearing");
        public static readonly By IsEveryoneConnectedText = CommonLocators.ElementContainingText("Is everyone connected?");
        public static readonly By PausedText = CommonLocators.ElementContainingText("Hearing paused");
        public static readonly By ResumeVideoCallButton = CommonLocators.ButtonWithInnerText("Resume video hearing");
        public static readonly By StartVideoHearingButton = CommonLocators.ButtonWithInnerText("Start video hearing");
        public static readonly By ChooseCameraMicrophoneButton = By.Id("changeCameraButton");
        public static readonly By CloseChangeDeviceButton = By.Id("change-device-btn");
        public static readonly By ConfirmStartHearingButton = By.Id("btnConfirmStart");
        public static readonly By CancelStartHearingButton = By.Id("btnCancelStart");
        public static readonly By EnterPrivateConsultationButton = By.Id("joinPCButton");
        public static readonly By NumberOfJohsInConsultaionRoom = By.Id("numberOfJohsInConsultationBadge");
    }
}
