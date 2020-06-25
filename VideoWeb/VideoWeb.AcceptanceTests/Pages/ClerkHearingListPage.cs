using System;
using AcceptanceTests.Common.PageObject.Helpers;
using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class ClerkHearingListPage
    {
        public static By NoHearingsWarningMessage = CommonLocators.ElementContainingText("You have no video hearings");
        public static By HearingListTitle = CommonLocators.ElementContainingText("Video hearings for");
        public static By Date(string date) => CommonLocators.ElementContainingText(date);
        public static By Time(Guid conferenceId) => By.Id($"scheduled-datetime-{conferenceId:D}");
        public static By Judge(Guid conferenceId) => By.Id($"judge-{conferenceId:D}");
        public static By CaseName(Guid conferenceId) => By.Id($"case-name-{conferenceId:D}");
        public static By CaseType(Guid conferenceId) => By.Id($"case-type-{conferenceId:D}");
        public static By CaseNumber(Guid conferenceId) => By.Id($"case-number-{conferenceId:D}");
        public static By Status(Guid conferenceId) => By.Id($"hearing-status-{conferenceId:D}");
        public static By ApplicantIndividualName(Guid conferenceId) => By.Id($"applicant-only-display-name-case-group-{conferenceId:D}");
        public static By ApplicantRepresentativeName(Guid conferenceId) => By.Id($"applicant-rep-display-name-{conferenceId:D}");
        public static By ApplicantRepresenteeName(Guid conferenceId) => By.Id($"applicant-rep-representee-{conferenceId:D}");
        public static By RespondentIndividualName(Guid conferenceId) => By.Id($"respondent-only-display-name-case-group-{conferenceId:D}");
        public static By RespondentRepresentativeName(Guid conferenceId) => By.Id($"respondent-rep-display-name-{conferenceId:D}");
        public static By RespondentRepresenteeName(Guid conferenceId) => By.Id($"respondent-rep-representee-{conferenceId:D}");
        public static By StartHearingButton(Guid conferenceId) => By.Id($"start-hearing-btn-{conferenceId:D}");
        public static By ContactUs = CommonLocators.ElementContainingText("Do you need help?");
        public static By PhoneNumber(string phoneNumber) => CommonLocators.ElementContainingText(phoneNumber);
        public static By CheckEquipmentButton = CommonLocators.ButtonWithInnerText("Check equipment");
        public static By ParticipantCount(Guid conferenceId) => By.Id($"participant-count-{conferenceId:D}");
    }
}
