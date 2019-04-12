using OpenQA.Selenium;
using VideoWeb.AcceptanceTests.Contexts;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class DeclarationPage
    {
        private const string WarningText = "Please tick the box to confirm that you will not record the hearing in any way";
        private const string ConsentCheckboxLabel =
            "I confirm that I will not record or take any images of this hearing";

        public DeclarationPage()
        {
        }

        public By NoConsentWarningMessage => CommonLocators.ElementContainingText(WarningText);
        public By ConsentCheckbox => CommonLocators.CheckboxWithLabel(ConsentCheckboxLabel);
    }
}
