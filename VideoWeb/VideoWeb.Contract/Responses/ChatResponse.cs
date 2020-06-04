using System;

namespace VideoWeb.Contract.Responses
{
    public class ChatResponse
    {
        public ChatResponse()
        {
            Id = Guid.NewGuid();
        }

        /// <summary>
        /// Message UUID
        /// </summary>
        public Guid Id { get; }
        
        /// <summary>
        /// Username of sender
        /// </summary>
        public string From { get; set; }
        
        /// <summary>
        /// Display name of sender
        /// </summary>
        public string FromDisplayName { get; set; }
        
        /// <summary>
        /// Username of recipient
        /// </summary>
        public string To { get; set; }
        
        /// <summary>
        /// Body of message
        /// </summary>
        public string Message { get; set; }
        
        /// <summary>
        /// Time of message
        /// </summary>
        public DateTime Timestamp { get; set; }
        
        /// <summary>
        /// Did the message originate from user logged in
        /// </summary>
        public bool IsUser { get; set; }
    }
}
