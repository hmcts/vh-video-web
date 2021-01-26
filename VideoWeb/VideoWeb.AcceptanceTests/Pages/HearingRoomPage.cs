using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class HearingRoomPage
    {
        public static readonly By PauseButton = By.Id("pause-hearing-img");
        public static readonly By CloseButton = By.Id("end-hearing-img");
        public static readonly By ConfirmClosePopup = By.Id("confirmationDialog");
        public static readonly By ConfirmCloseButton = By.Id("btnConfirmClose");
        public static readonly By ToggleSelfView = By.Id("toggle-self-view-img");
        public static readonly By JudgeIncomingVideo = By.Id("incomingFeedJudge");
        public static readonly By ParticipantIncomingVideo = By.Id("incomingFeed");
        public static readonly By SelfView = By.Id("outgoingFeedVideo");
        public static readonly By ToggleAudioMuteLocked = By.Id("toggle-audio-mute-locked-img");
    }
}
