using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class HearingRoomPage
    {
        public static By PauseButton = By.Id("pause-hearing-img");
        public static By CloseButton = By.Id("end-hearing-img");
        public static By ConfirmClosePopup = By.Id("confirmationDialog");
        public static By ConfirmCloseButton = By.Id("btnConfirmClose");
        public static By ToggleSelfView = By.Id("toggle-self-view-img");
        public static By JudgeIncomingVideo = By.Id("incomingFeedJudge");
        public static By ParticipantIncomingVideo = By.Id("incomingFeed");
        public static By SelfView = By.Id("outgoingFeedVideo");
    }
}
