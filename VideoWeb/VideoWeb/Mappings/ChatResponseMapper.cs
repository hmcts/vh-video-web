using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Responses;

namespace VideoWeb.Mappings
{
    public class ChatResponseMapper : IMapTo<InstantMessageResponse, string, bool, ConferenceDto, ChatResponse>
    {
        public ChatResponse Map(InstantMessageResponse message, string fromDisplayName, bool isUser, ConferenceDto conferenceDto)
        {
            
            var response = new ChatResponse
            {
                From = GetParticipantId(conferenceDto, message.From),
                FromDisplayName = fromDisplayName,
                To = GetParticipantId(conferenceDto, message.To),
                Message = message.MessageText,
                Timestamp = message.TimeStamp,
                IsUser = isUser
            };
            return response;
        }

        private string GetParticipantId(ConferenceDto conferenceDto, string username)
        {
            var participant = conferenceDto.Participants.SingleOrDefault(x => x.Username == username);
            return participant != null ? participant.Id.ToString() : username; 
        }
    }
}
