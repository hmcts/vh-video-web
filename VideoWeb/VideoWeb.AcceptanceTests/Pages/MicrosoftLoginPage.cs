using System;
using FluentAssertions;
using OpenQA.Selenium;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Helpers;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class MicrosoftLoginPage
    {
        private readonly BrowserContext _context;
        public MicrosoftLoginPage(BrowserContext browserContext)
        {
            _context = browserContext;
        }

        private static By UsernameTextfield => By.CssSelector("#i0116");
        private static By Passwordfield => By.XPath("//input[contains(@data-bind,'password')]");
        private static By Next => By.XPath("//input[contains(@data-bind,'Next') and (@value='Next')]");
        private static By SignIn => By.XPath("//input[contains(@data-bind,'SignIn') and (@value='Sign in')]");
        private static By NoButton => By.XPath("//input[contains(@data-bind,'Splitter') and (@value='No')]");

        public void Logon(string participantUsername, string password)
        {
            EnterUsername(participantUsername);
            NextButton();
            EnterPassword(password);
            SignInButton();
            DontStaySignedIn();
        }

        public void EnterUsername(string username)
        {
            Console.WriteLine($"Logging in as {username}");
            _context.NgDriver.WaitUntilElementVisible(UsernameTextfield).Clear();
            _context.NgDriver.WaitUntilElementVisible(UsernameTextfield).SendKeys(username);
        }

        public void EnterPassword(string password)
        {
            var maskedPassword = new string('*', (password ?? string.Empty).Length);
            Console.WriteLine($"Using password {maskedPassword}");
            _context.NgDriver.WaitUntilElementVisible(Passwordfield).Clear();
            _context.NgDriver.WaitUntilElementVisible(Passwordfield).SendKeys(password);
        }

        public void NextButton() => _context.NgDriver.WaitUntilElementVisible(Next).Click();
        public void SignInButton() => _context.NgDriver.WaitUntilElementVisible(SignIn).Click();
        public void DontStaySignedIn() => _context.NgDriver.WaitUntilElementVisible(NoButton).Click();

        public void SignInTitle()
        {
            _context.Retry(() => _context.NgDriver.Title.Trim().Should().Be("Sign in to your account"));
        }
    }
}
