using System;
using System.Linq;
using System.Threading.Tasks;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.User;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings
{
    public class ChatResponseMapper
    {
        private readonly IUserApiClient _userApiClient;

        public ChatResponseMapper(IUserApiClient userApiClient)
        {
            _userApiClient = userApiClient;
        }
        public async Task<ChatResponse> MapToResponseModel(MessageResponse message, ConferenceDetailsResponse conference,
            string username)
        {
            var response = new ChatResponse
            {
                From = message.From.ToLower(),
                Message = message.Message_text,
                Timestamp = message.Time_stamp,
                IsUser = message.From.Equals(username, StringComparison.InvariantCultureIgnoreCase)
            };

            response.From = await AssignMessageFromAsync(message.From, conference);
            
            return response;
        }

        private async Task<string> AssignMessageFromAsync(string responseFrom, ConferenceDetailsResponse conference)
        {
            var participant = conference.Participants.SingleOrDefault(x =>
                x.Username.Equals(responseFrom, StringComparison.InvariantCultureIgnoreCase));
            if (participant != null)
            {
                return participant.Display_name;
            }
            var profile = await _userApiClient.GetUserByAdUserNameAsync(responseFrom);
            return profile.First_name;
        }
    }
}
