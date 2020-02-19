using System;

namespace VideoWeb.Contract.Responses
{
    public class ChatResponse
    {
        public string From { get; set; }
        public string Message { get; set; }
        public DateTime Timestamp { get; set; }
        public bool IsUser { get; set; }
    }
}
