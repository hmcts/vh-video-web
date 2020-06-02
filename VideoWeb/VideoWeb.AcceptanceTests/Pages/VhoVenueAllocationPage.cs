using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class VhoVenueAllocationPage
    {
        public static By VenueCheckbox(string venue) => By.XPath($"//div[contains(text(),'{venue}')]/child::input");
        public static By VenuesTextBox = By.XPath("//div[@class='ng-input']/child::input");
        public static By VenuesDropdown = By.Id("venue-allocation-list");
        public static By VenueConfirmButton = By.Id("select-venue-allocation-btn");
    }
}
