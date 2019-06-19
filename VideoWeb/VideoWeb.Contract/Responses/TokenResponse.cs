using System;

namespace VideoWeb.Contract.Responses
{
    public class TokenResponse
    {
        public string ExpiresOn { get; set; }
        public string Token { get; set; }
    }
}