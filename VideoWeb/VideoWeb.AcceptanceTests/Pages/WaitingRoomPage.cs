using System;
using AcceptanceTests.Common.PageObject.Helpers;
using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class WaitingRoomPage
    {
        public static By HearingCaseDetails = By.XPath("//*[contains(@class,'hearing-details-col1-width')]");
        public static By HearingDate = By.XPath("//*[contains(@class,'hearing-details-col2-width')]");
        public static By ContactVhTeam = CommonLocators.ElementContainingText("Video hearings team");
        public static By OtherParticipantsStatus(Guid id) => By.Id($"p-{id:D}-status");
        public static By IndividualParticipantsList = By.XPath("//app-individual-participant-status-list/div//div[contains(@class,'govuk-grid-row')]//div[contains(@class,'govuk-grid-column')]");
        public static By ParticipantsList = By.XPath("//app-participant-status-list/div//div[contains(@class,'govuk-grid-row')]//div[contains(@class,'govuk-grid-column')]");
        public static By RowInformation(string id) => By.XPath($"//div[@id='{id}']/p");
        public static By AboutToBeginText = CommonLocators.ElementContainingText("Please stay near your screen");
        public static string AboutToBeginBgColour = "#0b0c0c";
        public static By DelayedHeader = CommonLocators.ElementContainingText("Your video hearing is delayed");
        public static By DelayedText = CommonLocators.ElementContainingText("We're sorry for the delay");
        public static string DelayedBgColour = "#ffdd00";
        public static By ScheduledHeader = CommonLocators.ElementContainingText("Your video hearing");
        public static By ScheduledText = CommonLocators.ElementContainingText("Please wait"); 
        public static string ScheduledBgColour = "#1d70b8";
        public static By TimePanel = By.XPath("(//div[contains(@class,'govuk-panel')])[1]");
        public static By PausedTitle = CommonLocators.ElementContainingText("Your video hearing is paused");
        public static By ClosedTitle = CommonLocators.ElementContainingText("Your video hearing is closed");
        public static By Frame = By.XPath("//app-participant-waiting-room");
        public static By IncomingPrivateConsultationFeed = By.Id("incomingFeedPrivate");
        public static By SelfViewButton = By.Id("outgoingFeedButton");
        public static By SelfViewVideo = By.Id("outgoingFeedVideo");
        public static By PrivateConsultationLink(string participantId) => By.XPath($"//div[@id='p-row-{participantId}']/a");
    }
}
