using System;

namespace VideoWeb.Contract.Responses
{
    public class TokenResponse
    {
        public DateTime ExpiresOn { get; set; }
        public string Token { get; set; }
    }
}