using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class WaitingRoomPage
    {
        public By HearingCaseDetails = By.XPath("//*[contains(@class,'hearing-details-col1-width')]");
        public By HearingDate = By.XPath("//*[contains(@class,'hearing-details-col2-width')]");
        public By ContactVhTeam => CommonLocators.ElementContainingText("Video hearings team");

        public By OtherParticipantsStatus(string displayName) =>
            By.XPath(
                $"//div[@class='govuk-grid-row']//strong[contains(text(), '{displayName}')]/../../div");

        public By IndividualParticipantsList => By.XPath("//app-individual-participant-status-list/div//div[contains(@class,'govuk-grid-row')]//div[contains(@class,'govuk-grid-column')]");

        public By ParticipantsList =>
            By.XPath("//app-participant-status-list/div//div[contains(@class,'govuk-grid-row')]//div[contains(@class,'govuk-grid-column')]");

        public By RowInformation(string id) => By.XPath($"//div[@id='{id}']/p");

        public By AboutToBeginText => CommonLocators.ElementContainingText("Please stay near your screen");
        public string AboutToBeginBgColour = "#0b0c0c";

        public By DelayedHeader => CommonLocators.ElementContainingText("Your video hearing is delayed");
        public By DelayedText => CommonLocators.ElementContainingText("We're really sorry your hearing is delayed");
        public string DelayedBgColour = "#ffbf47";

        public By ScheduledHeader => CommonLocators.ElementContainingText("Your video hearing");
        public By ScheduledText => By.XPath("//h3[text()='Please keep an eye on the time']"); 
        public string ScheduledBgColour = "#005ea5";

        public By TimePanel => By.XPath("//div[contains(@class,'govuk-panel')][1]");

        public By PausedTitle => CommonLocators.ElementContainingText("Your video hearing is paused");
        public By ClosedTitle => CommonLocators.ElementContainingText("Your video hearing is closed");

        public By PrivateConsultationLink(string participantId) => By.XPath($"//div[@id='p-row-{participantId}']/a");
        public By OutgoingCallMessage => CommonLocators.ElementContainingText("Your contact request has been sent to");
        public By IncomingCallMessage => CommonLocators.ElementContainingText("Incoming call");       
        public By Frame => By.XPath("//app-participant-waiting-room");
        public By IncomingVideo => By.XPath("//video[@id='incomingFeed']");
        public By SelfViewButton => By.Id("outgoingFeedButton");
        public By SelfViewVideo => By.Id("outgoingFeedVideo");
        public By ClosePrivateConsultationButton => By.Id("close-pc-btn");
        public By CallRejectedMessage => CommonLocators.ElementContainingText("Your call request has not been accepted");
        public By CallRejectedCloseButton => By.Id("close-pc-rejection-btn");
        public By AcceptPrivateCall() => By.XPath("//input[@value='Accept call']");
        public By RejectPrivateCall() => By.XPath("//input[@value='Reject call']");
    }
}
