using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class PrivateConsultationRoomPage
    {
        public static readonly By RoomTitle = By.ClassName("room-title");
        public static readonly By LockedBadge = By.CssSelector(".lock-badge.locked");
        public static readonly By IncomingFeed = By.CssSelector("video[id^='incomingFeed']");
        public static readonly By LockButton = By.Id("lockButton-desktop");
        public static readonly By LeavePrivateConsultationButton = By.Id("leaveButton-desktop");
        public static readonly By ConfirmLeavePrivateConsultationButton = By.XPath("//app-modal//button[text()=' Leave ']");
        public static readonly By ToggleMute = By.CssSelector("#toggle-audio-mute-img-desktop > span");
        public const string ToggleMuteMicOn = "fa-microphone";
        public const string ToggleMuteMicOff = "fa-microphone-slash";
        public static readonly By ToggleSelfViewButton = By.CssSelector("#toggle-self-view-img-desktop > span");
        public const string ToggleSelfViewHide = "fa-eye-slash";
        public const string ToggleSelfViewShow = "fa-eye";
        public static readonly By SelfViewVideo = By.Id("outgoingFeedVideo");
        public static readonly By ParticipantsInRoom = By.CssSelector(".participant-grid span.yellow");

        public static By StatusOfUser(string name) => By.XPath(
            $"//*[@class='red' and text()='Declined']");
    }
}
