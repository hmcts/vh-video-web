using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class LoginPage
    {
        public By UsernameTextfield => By.CssSelector("#i0116");
        public By Passwordfield => By.XPath("//input[contains(@data-bind,'password')]");
        public By Next => By.XPath("//input[contains(@data-bind,'Next') and (@value='Next')]");
        public By SignIn => By.XPath("//input[contains(@data-bind,'SignIn') and (@value='Sign in')]");
        public string SignInTitle = "Sign in to your account";
    }
}
