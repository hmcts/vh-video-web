using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class LoginPage
    {
        public static By UsernameTextfield => By.CssSelector("#i0116");
        public static By PasswordField => By.XPath("//input[contains(@data-bind,'password')]");
        public static By Next => By.XPath("//input[contains(@data-bind,'Next') and (@value='Next')]");
        public static By SignIn => By.XPath("//input[contains(@data-bind,'SignIn') and (@value='Sign in')]");
        public static string SignInTitle = "Sign in to your account";
    }
}
