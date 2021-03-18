using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class AccountTypeSelectionPage
    {
        public static readonly By Heading = By.CssSelector("h1");
        public static readonly By HearingParticipantRadioButton = By.Id("vhaad");
        public static readonly By NextButton = By.XPath("//button[text()=' Next ']");

        public const string HeadingText = "Select your account type to sign in";
    }
}
