using System;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings
{
    public class ChatResponseMapper
    {
        public ChatResponse MapToResponseModel(MessageResponse message, string username)
        {
            return new ChatResponse
            {
                From = message.From.ToLower(),
                Message = message.Message_text,
                Timestamp = message.Time_stamp,
                IsUser = message.From.Equals(username, StringComparison.InvariantCultureIgnoreCase)
            };
        }
    }
}
