using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class HearingRoomPage
    {
        public const string JudgeIframeId = "judgeIframe";
        public static By JudgeIframe = By.Id(JudgeIframeId);
        public static By TechnicalIssues = By.Id("technicalIssuesButton");
        public static By PauseButton = By.Id("pauseButton");
        public static By CloseButton = By.Id("closeButton");
        public static By ToggleSelfView = By.Id("selfViewButton");
        public static By ClerkIncomingVideo = By.Id("incomingVideo");
        public static By ParticipantIncomingVideo = By.Id("incomingFeed");
        public static By SelfView = By.Id("selfviewVideo");
    }
}
