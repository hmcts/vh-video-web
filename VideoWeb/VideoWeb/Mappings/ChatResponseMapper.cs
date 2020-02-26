using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings
{
    public class ChatResponseMapper
    {
        public ChatResponse MapToResponseModel(InstantMessageResponse message, string fromDisplayName, bool isUser)
        {
            var response = new ChatResponse
            {
                From = fromDisplayName,
                Message = message.Message_text,
                Timestamp = message.Time_stamp,
                IsUser = isUser
            };
            return response;
        }
    }
}
