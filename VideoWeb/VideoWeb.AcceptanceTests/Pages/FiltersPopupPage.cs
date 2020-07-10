using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class FiltersPopupPage
    {
        public static By FiltersPopup = By.Id("filterPopup");
        public static By CheckBox(string label) => By.XPath($"//label[text()='{label}']/parent::div/input");
        public static By ApplyButton = By.Id("applyFilter");
        public static By ClearFiltersLink = By.LinkText("Clear filters");
        public static By SelectAllCheckboxes = By.XPath("//input[contains(@id,'allRooms')]");
        public static By SelectAllCheckbox(int i) => By.XPath($"(//input[contains(@id,'allRooms')])[{i}]");
    }
}
