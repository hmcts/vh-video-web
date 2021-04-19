using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class AccountTypeSelectionPage
    {
        public static readonly By Heading = By.CssSelector("h1");
        public static readonly By HearingParticipantRadioButton = By.Id("vhaad");
        public static readonly By JohUserRadioButton = By.Id("ejud");
        public static readonly By NextButton = By.XPath("//button[text()=' Next ']");
        public static readonly By DoNotStayLoggedInButton = By.Id("idBtn_Back");
    }
}
