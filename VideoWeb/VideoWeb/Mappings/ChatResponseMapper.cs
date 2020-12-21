using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings
{
    public class ChatResponseMapper : IMapTo<InstantMessageResponse, string, bool, ChatResponse>
    {
        public ChatResponse Map(InstantMessageResponse message, string fromDisplayName, bool isUser)
        {
            var response = new ChatResponse
            {
                From = message.From,
                FromDisplayName = fromDisplayName,
                To = message.To,
                Message = message.Message_text,
                Timestamp = message.Time_stamp,
                IsUser = isUser
            };
            return response;
        }
    }
}
