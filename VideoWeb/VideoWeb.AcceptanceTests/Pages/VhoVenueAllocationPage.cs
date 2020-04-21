using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class VhoVenueAllocationPage
    {
        public static By VenueCheckbox(string venue) => By.XPath($"//div[contains(text(),'{venue}')]/preceding-sibling::input");
        public static By VenuesDropdown = By.Id("venue-allocation-list");
        public static By VenueConfirmButton = By.Id("select-venue-allocation-btn");
    }
}
