using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    internal static class CommonLocators
    {
        public static By ElementContainingText(string text) => By.XPath($"//*[contains(text(), '{text}')]");
        public static By ButtonWithLabel(string label) => By.XPath($"//input[contains(@class,'govuk-button') and @role='button' and @value='{label}']");

        public static By CheckboxWithLabel(string label) =>
            By.XPath($"//label[contains(text(),'{label}')]/../input[contains(@class,'govuk-checkboxes__input')]");

        public static By ImageWithAltTags(string alt) => By.XPath($"//img[contains(@alt,'{alt}')]");

        public static By RadioButtonWithLabel(string label) =>
            By.XPath($"//div[@class='govuk-radios__item']//label[contains(text(),'{label}')]/../input");

        public static By WarningMessageAfterRadioButton(string label) =>
            By.XPath($"//label[contains(text(),'{label}')]/div[@class='govuk-details__text']");
    }
}
