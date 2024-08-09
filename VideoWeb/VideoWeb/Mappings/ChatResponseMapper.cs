using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoApi.Contract.Responses;

namespace VideoWeb.Mappings;

public static class ChatResponseMapper
{
    public static ChatResponse Map(InstantMessageResponse message, string fromDisplayName, bool isUser, Conference conference)
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
    
    private static string GetParticipantId(Conference conference, string username)
    {
        var participant = conference.Participants.SingleOrDefault(x => x.Username == username);
        return participant != null ? participant.Id.ToString() : username;
    }
}
