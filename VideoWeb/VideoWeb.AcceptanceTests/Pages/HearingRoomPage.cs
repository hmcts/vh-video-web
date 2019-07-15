using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class HearingRoomPage
    {
        public HearingRoomPage()
        {
        }

        public const string JudgeIframeId = "judgeIframe";

        public By JudgeIframe => By.XPath($"//iframe[@id='{JudgeIframeId}']");

        public By TechnicalIssues = By.Id("technicalIssuesButton");
        public By PauseButton = By.Id("pauseButton");
        public By CloseButton = By.Id("closeButton");
        public By ToggleSelfview = By.Id("selfViewButton");

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