using AcceptanceTests.Common.PageObject.Helpers;
using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class ErrorPage
    {
        private const string TypedError = "If you typed the web address, check it is correct.";
        private const string PasteError = "If you pasted the web address, check you copied the entire address.";
        private const string LinkError = "If the web address is correct or you selected a link or button, contact us using the options below.";
        private const string NotRegisteredError = "It looks like you are not registered for this service.";
        private const string IsThisAMistakeError = "If you think this is a mistake and you need to speak to someone, please contact us using the options below.";
        public static By NotFoundPageTitle = CommonLocators.ElementContainingText("Page not found");
        public static By UnauthorisedPageTitle = CommonLocators.ElementContainingText("You are not authorised to use this service");
        public static By TypedErrorMessage = CommonLocators.ElementContainingText(TypedError);
        public static By PastedErrorMessage = CommonLocators.ElementContainingText(PasteError);
        public static By LinkErrorMessage = CommonLocators.ElementContainingText(LinkError);
        public static By NotRegisteredErrorMessage = CommonLocators.ElementContainingText(NotRegisteredError);
        public static By IsThisAMistakeErrorMessage = CommonLocators.ElementContainingText(IsThisAMistakeError);
        public static By UnsupportedBrowserTitle = By.Id("unsupported");
        public static By UnsupportedDeviceTitle = By.Id("unsupportedDevice");
    }
}
