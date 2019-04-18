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
        public By HearingDate = By.XPath("//p[@aria-label='date of hearing']");
        public By ScheduledDuration = By.XPath("//p[@aria-label='scheduled time and duration of hearing']");

        public By ParticipantStatus(string displayName) =>
            By.XPath(
                $"//div[@class='govuk-grid-row']//strong[contains(text(), '{displayName}')]/../../div");

        public By ReturnToHearingRoomLink = By.LinkText("Return to hearing list");
        public By ContactVho => CommonLocators.ElementContainingText("Contact video hearings officer");
        public By ContactHelpline => CommonLocators.ElementContainingText("Helpline");
    }
}
