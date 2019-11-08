using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class ErrorPage
    {
        public ErrorPage()
        {
        }

        private const string TypedError = "If you typed the web address, check it is correct.";
        private const string PasteError = "If you pasted the web address, check you copied the entire address.";
        private const string LinkError = "If the web address is correct or you selected a link or button, contact us using the options below.";

        private const string NotRegisteredError = "It looks like you are not registered for this service.";

        private const string IsThisAMistakeError =
            "If you think this is a mistake and you need to speak to someone, please contact us using the options below.";

        private const string ThisBrowserIsUnsupportedError = "This website is not supported on this browser";

        public By NotFoundPageTitle = CommonLocators.ElementContainingText("Page not found");
        public By UnauthorisedPageTitle = CommonLocators.ElementContainingText("You are not authorised to use this service");
        public By TypedErrorMessage = CommonLocators.ElementContainingText(TypedError);
        public By PastedErrorMessage = CommonLocators.ElementContainingText(PasteError);
        public By LinkErrorMessage = CommonLocators.ElementContainingText(LinkError);
        public By NotRegisteredErrorMessage = CommonLocators.ElementContainingText(NotRegisteredError);
        public By IsThisAMistakeErrorMessage = CommonLocators.ElementContainingText(IsThisAMistakeError);
        public By UnsupportedBrowserTitle = CommonLocators.ElementContainingText(ThisBrowserIsUnsupportedError);
    }
}
