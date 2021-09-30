using System;
using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class VhoHearingListPage
    {
        public static By CaseName(Guid conferenceId) => By.Id($"{conferenceId:D}-case-name");
        public static By CaseNumber(Guid conferenceId) => By.Id($"{conferenceId:D}-case-number");
        public static By CaseNumbers = By.XPath("//*[contains(@id, 'case-number')]");
        public static By HearingTime(Guid conferenceId) => By.Id($"{conferenceId:D}-time");
        public static By HearingTimes = By.XPath("//*[contains(@id, 'time')]");
        public static By ListedFor(Guid conferenceId) => By.Id($"{conferenceId:D}-duration");
        public static By NumberOfAlerts(Guid conferenceId) => By.Id($"{conferenceId:D}--pending-tasks");
        public static By StatusBadge(Guid conferenceId) => By.Id($"{conferenceId:D}-hearing-status");
        public static By UnreadMessagesBadge(Guid conferenceId) => By.Id($"{conferenceId:D}-unread-messages");
        public static By SelectHearingButton(Guid conferenceId) => By.Id($"{conferenceId:D}-summary");
        public static By ParticipantContactLink(Guid participantId) => By.Id($"participant-contact-details-link-{participantId:D}");
        public static By ParticipantContactName(Guid participantId) => By.Id($"tooltip-name-case-group-{participantId:D}");
        public static By ParticipantContactEmail(Guid participantId) => By.Id($"tooltip-email-{participantId:D}");
        public static By ParticipantContactPhone(Guid participantId) => By.Id($"tooltip-contact-phone-{participantId:D}");
        public static By FiltersButton = By.Id("filters-court-rooms");
        public static By HearingsTabButton = By.Id("hearingsTabButton");
        public static By MessagesTabButton = By.Id("messagesTabButton");
        public static By SelectParticipantToMessage(Guid participantId) => By.Id($"{participantId:D}-unread-messages-image");
        public static By TelephoneIcon = By.Id("telephoneIcon");
        public static By ConsultationRoomLink(string closeTime) => By.XPath($"//a[contains(text(),'Judicial consultation room open until {closeTime}')]");
        //public static By CopyConferenceID(Guid conferenceId) => By.Id($"copy-conference-id-{conferenceId:D}/a");
        public static By CopyConferenceID(string conferenceId) => By.XPath($"//span[@id='copy-conference-id-{conferenceId:D}']/a");
        public static By CopyQuickLink(string conferenceId) => By.XPath($"//span[@id='copy-quick-link-{conferenceId:D}']/a");
        public static By CopyTelephoneID(string telephoneId) => By.XPath($"//span[@id='copy-telephone-id-{telephoneId}']/a");
        public static By HearingLinkHover(string conferenceId) => By.XPath($"//div[@id='{conferenceId}-summary']/div/span[@id='copyTooltip']");

    }
}
