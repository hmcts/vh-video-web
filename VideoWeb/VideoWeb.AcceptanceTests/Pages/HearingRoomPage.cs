using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class HearingRoomPage
    {
        public HearingRoomPage()
        {
        }

        public By SideMenuArrow = CommonLocators.IframeButtonWithTooltip("Sidemenu");
        public By RequestAssistance = CommonLocators.IframeButtonWithTooltip("Request assistance");
        public By PauseHearing = CommonLocators.IframeButtonWithTooltip("Pause hearing");
        public By EndHearing = CommonLocators.IframeButtonWithTooltip("End hearing");
        public By ToggleSelfview = CommonLocators.IframeButtonWithTooltip("Toggle selfview");
        public By MuteCamera = CommonLocators.IframeButtonWithTooltip("Mute camera");
        public By MuteMicrophone = CommonLocators.IframeButtonWithTooltip("Mute microphone");
        public By Disconnect = CommonLocators.IframeButtonWithTooltip("Disconnect");
        public By ToggleFullscreen = CommonLocators.IframeButtonWithTooltip("Toggle fullscreen");

        public By IncomingVideo = By.Id("incomingVideo");
        public By SelfView = By.Id("selfviewVideo");

        public By PauseSelectWindowText = CommonLocators.ElementContainingText("Do you wish to pause the hearing?");
        public By PauseConfirmationWindowText = CommonLocators.ElementContainingText("The hearing will be paused for 30 minutes");
        public By PausePopupStartRecessButton = CommonLocators.ButtonWithInnertext("Start recess");
        public By PausePopupCancelButton = CommonLocators.ButtonWithInnertext("Cancel");
        public By PausePopupConfirmRecessButton = CommonLocators.ButtonWithInnertext("Confirm recess");
        public By PausedWindowText = CommonLocators.ElementContainingText("Hearing paused");
        public By PausedOkButton = CommonLocators.ButtonWithInnertext("OK");

        public By EndConfirmationWindowText = CommonLocators.ElementContainingText("Do you wish to end the hearing?");
        public By EndPopupConfirmButton = CommonLocators.ButtonWithInnertext("Yes, end hearing");
        public By EndPopupCancelButton = CommonLocators.ButtonWithInnertext("Cancel");
    }
}