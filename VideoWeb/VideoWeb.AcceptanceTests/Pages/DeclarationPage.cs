using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class DeclarationPage
    {
        private const string WarningText = "Please tick the box to confirm that you will not record the hearing in any way";
        private const string ConsentCheckboxLabel =
            "I confirm that I will not record or take any images of this hearing";
        public static By NoConsentWarningMessage => CommonLocators.ElementContainingText(WarningText);
        public static By ConsentCheckbox => CommonLocators.CheckboxWithLabel(ConsentCheckboxLabel);
    }
}
