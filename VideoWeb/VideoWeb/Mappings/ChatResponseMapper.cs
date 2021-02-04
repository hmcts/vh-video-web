using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoApi.Contract.Responses;

namespace VideoWeb.Mappings
{
    public class ChatResponseMapper : IMapTo<InstantMessageResponse, string, bool, Conference, ChatResponse>
    {
        public ChatResponse Map(InstantMessageResponse message, string fromDisplayName, bool isUser, Conference conference)
        {
            
            var response = new ChatResponse
            {
                From = GetParticipantId(conference, message.From),
                FromDisplayName = fromDisplayName,
                To = GetParticipantId(conference, message.To),
                Message = message.MessageText,
                Timestamp = message.TimeStamp,
                IsUser = isUser
            };
            return response;
        }

        private string GetParticipantId(Conference conference, string username)
        {
            var participant = conference.Participants.SingleOrDefault(x => x.Username == username);
            return participant != null ? participant.Id.ToString() : username; 
        }
    }
}
