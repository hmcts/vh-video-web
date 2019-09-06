using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class HearingRoomPage
    {
        public const string JudgeIframeId = "judgeIframe";
        public By JudgeIframe => By.XPath($"//iframe[@id='{JudgeIframeId}']");
        public By TechnicalIssues = By.Id("technicalIssuesButton");
        public By PauseButton = By.Id("pauseButton");
        public By CloseButton = By.Id("closeButton");
        public By ToggleSelfview = By.Id("selfViewButton");
        public By IncomingVideo = By.Id("incomingVideo");
        public By ParticipantIncomingVideo = By.Id("incomingFeed");
        public By SelfView = By.Id("selfviewVideo");
    }
}