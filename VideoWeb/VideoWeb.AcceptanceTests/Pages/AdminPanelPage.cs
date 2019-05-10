using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class AdminPanelPage
    {
        public AdminPanelPage()
        {
        }
     
        public By AlertTimestamp => CommonLocators.TableCellContainingText(":");
        public By AlertMessage(string displayname) => CommonLocators.TableCellContainingText(displayname);
        public By AlertType(string role) => CommonLocators.TableCellContainingText(role);
    }
}
