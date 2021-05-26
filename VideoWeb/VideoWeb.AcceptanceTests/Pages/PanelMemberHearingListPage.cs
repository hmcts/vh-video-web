using System;
using AcceptanceTests.Common.PageObject.Helpers;
using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class PanelMemberHearingListPage
    {
        public static By NoHearingsWarningMessage = CommonLocators.ElementContainingText("You have no video hearings");
        public static By HearingListTitle = CommonLocators.ElementContainingText("Video hearings for");
        public static By Date(string date) => CommonLocators.ElementContainingText(date);
        public static By Time(Guid conferenceId) => By.Id($"scheduled-datetime-{conferenceId:D}");
        public static By CaseName(Guid conferenceId) => By.Id($"case-name-{conferenceId:D}");
        public static By CaseType(Guid conferenceId) => By.Id($"case-type-{conferenceId:D}");
        public static By CaseNumber(Guid conferenceId) => By.Id($"case-number-{conferenceId:D}");
    }
}
