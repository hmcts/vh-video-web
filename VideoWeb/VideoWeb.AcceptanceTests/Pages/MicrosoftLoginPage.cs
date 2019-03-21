using System;
using FluentAssertions;
using OpenQA.Selenium;
using VideoWeb.AcceptanceTests.Helpers;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class MicrosoftLoginPage
    {
        private BrowserContext _context;
        public MicrosoftLoginPage(BrowserContext browserContext)
        {
            _context = browserContext;
        }

        private By _usernameTextfield => By.CssSelector("#i0116");
        private By _passwordfield => By.XPath("//input[contains(@data-bind,'password')]");
        private By _next => By.XPath("//input[contains(@data-bind,'Next') and (@value='Next')]");
        private By _signIn => By.XPath("//input[contains(@data-bind,'SignIn') and (@value='Sign in')]");
        private By _noButton => By.XPath("//input[contains(@data-bind,'Splitter') and (@value='No')]");
        private By _pageTitle => By.XPath("//*[@class='govuk-heading-l']");
        private By _startNowButton => By.XPath("//*[@type='button']");
        private By _loginBanner => By.Id("//*[@id='otherTileText']");

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
            _context.NgDriver.WaitUntilElementVisible(_usernameTextfield).Clear();
            _context.NgDriver.WaitUntilElementVisible(_usernameTextfield).SendKeys(username);
        }

        public void EnterPassword(string password)
        {
            string maskedPassword = new string('*', (password ?? string.Empty).Length);
            Console.WriteLine($"Using password {maskedPassword}");
            _context.NgDriver.WaitUntilElementVisible(_passwordfield).Clear();
            _context.NgDriver.WaitUntilElementVisible(_passwordfield).SendKeys(password);
        }

        public void NextButton() => _context.NgDriver.WaitUntilElementVisible(_next).Click();
        public void SignInButton() => _context.NgDriver.WaitUntilElementVisible(_signIn).Click();
        public void DontStaySignedIn() => _context.NgDriver.WaitUntilElementVisible(_noButton).Click();
        public void SignInTitle()
        {
            _context.Retry(() => _context.NgDriver.Title.Trim().Should().Be("Sign in to your account"));
        }
    }
}
