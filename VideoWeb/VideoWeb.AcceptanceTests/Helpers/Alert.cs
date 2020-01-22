using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Helpers
{
    public class Alert
    {
        public int Row { get; set; }
        public IWebElement Checkbox { get; set; }
        public string Timestamp { get; set; }
        public string AlertType { get; set; }
        public string Username { get; set; }
        public string ActionedAt { get; set; }
        public string ActionedBy { get; set; }
    }
}
