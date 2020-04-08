using System;
using AcceptanceTests.Common.PageObject.Helpers;
using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class ParticipantHearingListPage
    {
        public static By HearingListPageTitle = By.XPath("//*[contains(text(), 'Video hearings for') or contains(text(),'Your video hearing') or contains(text(),'Your video hearings')]");
        public static By NoHearingsWarningMessage = CommonLocators.ElementContainingText("You do not have a video hearing today");
        public static By CaseName(Guid conferenceId) => By.Id($"participant-case-name-{conferenceId:D}");
        public static By CaseNumber(Guid conferenceId) => By.Id($"participant-case-number-{conferenceId:D}");
        public static By HearingDate(Guid conferenceId) => By.Id($"participant-scheduled-date-{conferenceId:D}");
        public static By HearingTime(Guid conferenceId) => By.Id($"participant-scheduled-time-{conferenceId:D}");
        public static By SignInDate(Guid conferenceId) => By.Id($"participant-sign-in-date-{conferenceId:D}");
        public static By SignInTime(Guid conferenceId) => By.Id($"participant-sign-in-time-{conferenceId:D}");
        public static By SignInButton(Guid conferenceId) => By.Id($"sign-into-hearing-btn-{conferenceId:D}");
    }
}
