using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class WaitingRoomPage
    {
        public WaitingRoomPage()
        {
        }

        public By HearingName = By.XPath("//h1[contains(text(),'Your hearing')]/..//h2[@class='govuk-heading-m']");
        public By CaseNumber = By.XPath("//h1[contains(text(),'Your hearing')]/..//h3[@class='govuk-heading-m']");
        public By HearingDate = By.XPath("//span[@aria-label='date of hearing']");
        public By ScheduledDuration = By.XPath("//span[@aria-label='scheduled time and duration of hearing']");

        public By ParticipantStatus(string displayName) =>
            By.XPath(
                $"//div[@class='govuk-grid-row']//strong[contains(text(), '{displayName}')]/../../div");
    }
}
