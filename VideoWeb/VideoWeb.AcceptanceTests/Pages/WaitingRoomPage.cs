using AcceptanceTests.Common.PageObject.Helpers;
using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class WaitingRoomPage
    {
        public static readonly By HearingCaseDetails = By.XPath("//*[contains(@class,'hearing-details-col1-width')]");
        public static readonly By HearingDate = By.XPath("//*[contains(@class,'hearing-details-col2-width')]");
        public static readonly By ContactVhTeam = CommonLocators.ElementContainingText("Video hearings team");
        public static readonly By AboutToBeginText = CommonLocators.ElementContainingText("Please stay near your screen");
        public const string AboutToBeginBgColour = "#0b0c0c";
        public static readonly By DelayedHeader = CommonLocators.ElementContainingText("Your video hearing is delayed");
        public static readonly By DelayedText = CommonLocators.ElementContainingText("We're sorry for the delay");
        public static readonly string DelayedBgColour = "#ffdd00";
        public static readonly By ScheduledHeader = CommonLocators.ElementContainingText("Your video hearing");
        public static readonly By ScheduledText = CommonLocators.ElementContainingText("Please wait"); 
        public const string ScheduledBgColour = "#1d70b8";
        public static readonly By TimePanel = By.XPath("(//div[contains(@class,'govuk-panel')])[1]");
        public static readonly By PausedTitle = CommonLocators.ElementContainingText("Your video hearing is paused");
        public static readonly By ClosedTitle = CommonLocators.ElementContainingText("Your video hearing is closed");
        public static readonly By Frame = By.XPath("//app-participant-waiting-room");
        public static readonly By StartPrivateMeetingButton = By.Id("openStartPCButton");
        public static readonly By JoinPrivateMeetingButton = By.Id("openJoinPCButton");
        public static readonly By EnabledParticipants = By.CssSelector("input[type=checkbox]:enabled");
        public static By MeetingRoomRadioButtonFor(string room) => By.XPath($"//input[./following-sibling::label/span[contains(text(),'{room.ToLower()}')]]");
        public static By InviteCheckboxFor(string displayName) => By.XPath($"//input[@type='checkbox' and ./following-sibling::label/span[text()='{displayName}']]");
        public static readonly By ContinueButton = By.Id("continue-btn");
        public static readonly By ConsultationRoomText = CommonLocators.ElementContainingText("The consultation room is available for up to 30 minutes after the hearing has finished.");
        public static By ConsultationRoomCloseText(string closeTime) => CommonLocators.ElementContainingText($"The consultation room will close at {closeTime}");
    }
}
