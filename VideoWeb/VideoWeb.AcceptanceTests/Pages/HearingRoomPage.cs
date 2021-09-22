using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class HearingRoomPage
    {
        public static readonly By PauseButton = By.Id("pause-hearing");
        public static readonly By CloseButtonDesktop = By.Id("end-hearing-desktop");
        public static readonly By ConfirmClosePopup = By.Id("confirmationDialog");
        public static readonly By ConfirmCloseButton = By.Id("btnConfirmClose");
        public static readonly By ToggleSelfView = By.Id("toggle-self-view-img");
        public static readonly By IncomingVideoFeed = By.CssSelector("video[id^='incomingFeed']");
        public static readonly By SelfView = By.Id("outgoingFeedVideo");
        public static readonly By ToggleAudioMuteLocked = By.Id("toggle-audio-mute-locked-img");
        public static readonly By ToggleHandRaised = By.Id("toggle-hand-raised-img");
        public static readonly By HandRaised = By.ClassName($"fa-hand-paper");
        public static readonly By ParticipantPanel = By.Id($"panelList");
        public static By InterPreterName(string displayName) => By.XPath($"//span[contains(text()[2], '{displayName}')]");
    }
}
