using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class WaitingRoomPage
    {
        public WaitingRoomPage()
        {
        }

        public By HearingName = By.XPath("//h1[contains(text(),'hearing')]/..//h2[@class='govuk-heading-m']");
        public By CaseNumber = By.XPath("//h1[contains(text(),'hearing')]/..//h3[@class='govuk-heading-m']");
        public By HearingDate = By.XPath("//p[contains(@aria-label,'date of hearing')]");
        public By JudgeHearingTime = By.XPath("//p[contains(@aria-label,'scheduled time and duration of hearing')]");
        public By ScheduledDuration = By.XPath("//p[@aria-label='scheduled time and duration of hearing']");

        public By ParticipantStatus(string displayName) =>
            By.XPath(
                $"//div[@class='govuk-grid-row']//strong[contains(text(), '{displayName}')]/../../div");

        public By ReturnToHearingRoomLink = By.LinkText("Return to hearing list");
        public By ContactVho => CommonLocators.ElementContainingText("Contact video hearings officer");
        public By ContactHelpline => CommonLocators.ElementContainingText("helpline");

        public By AboutToBeginHeader => CommonLocators.ElementContainingText("Your hearing is about to begin");
        public By AboutToBeginText => CommonLocators.ElementContainingText("Please keep an eye on the time");
        public string AboutToBeginBgColour = "#0b0c0c";

        public By DelayedHeader => CommonLocators.ElementContainingText("Your hearing is delayed");
        public By DelayedText => CommonLocators.ElementContainingText("We're really sorry your hearing is delayed");
        public string DelayedBgColour = "#ffbf47";

        public By ScheduledHeader => CommonLocators.ElementContainingText("Your hearing");
        public By ScheduledText => CommonLocators.ElementContainingText("Please keep an eye on the time");
        public string ScheduledBgColour = "#005ea5";

        public By TimePanel => By.XPath("//div[contains(@class,'govuk-panel') and @ng-reflect-klass='govuk-panel']");
    }
}
