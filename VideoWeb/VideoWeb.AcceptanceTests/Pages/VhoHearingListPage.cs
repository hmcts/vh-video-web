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
        public static By ListedFor(Guid conferenceId) => By.Id($"{conferenceId:D}-duration");
        public static By NumberOfAlerts(Guid conferenceId) => By.Id($"{conferenceId:D}--pending-tasks");
        public static By StatusBadge(Guid conferenceId) => By.Id($"{conferenceId:D}-status");
        public static By UnreadMessagesBadge(Guid conferenceId) => By.Id($"{conferenceId:D}-unread-messages");
        public static By SelectHearingButton(Guid conferenceId) => By.Id($"{conferenceId:D}-summary");
        public static By ParticipantContactLink(Guid participantId) => By.Id($"participant-contact-details-link-{participantId:D}");
        public static By ParticipantContactName(Guid participantId) => By.Id($"tooltip-name-case-group-{participantId:D}");
        public static By ParticipantContactEmail(Guid participantId) => By.Id($"tooltip-email-{participantId:D}");
        public static By ParticipantContactPhone(Guid participantId) => By.Id($"tooltip-contact-phone-{participantId:D}");
        public static By FiltersButton = By.Id("filterButton");
        public static By VenuesDropdown = By.Id("venue-selection");
        public static By VenueCheckbox(string venue) => By.XPath($"//div[contains(text(),'{venue}')]/preceding-sibling::input");
    }
}
