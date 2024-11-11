using System;
using System.Threading.Tasks;
using VideoWeb.Common.Models;

namespace VideoWeb.EventHub.Services;

public class InstantMessageRules(IUserProfileService userProfileService)
{
    public static string DefaultAdminName => "Admin";
    
    /// <summary>
    /// Check if the one side is in the conference and the other is an Admin or a staff member admin privileges
    /// </summary>
    /// <param name="conference"></param>
    /// <param name="to">This is either the DefaultAdminName or a string representation of a participant ID (GUID)</param>
    /// <param name="from">the username of the sender</param>
    /// <returns>true if the conversation is permitted</returns>
    public async Task<bool> CanExchangeMessage(Conference conference, string to, string from)
    {
        var isFromParticipant = conference.IsParticipantInConference(from);
        var isToAdmin = to.Equals(DefaultAdminName, StringComparison.InvariantCultureIgnoreCase);
        if (isToAdmin && isFromParticipant)
        {
            return true;
        }
        
        // if not to an admin, check if the to is a valid Guid of a participant in the conference
        if (!Guid.TryParse(to, out var toGuid))
        {
            return false;
        }
        
        // make sure the id if for a participant in the conference
        if(!conference.Participants.Exists(p => p.Id == toGuid))
        {
            return false;
        }
        
        // if the recipient is a participant, sender must be an admin (note: staff members who can access the CC have the admin role too)
        var fromUser = await userProfileService.GetUserAsync(from);
        return fromUser.IsAdmin;
    }

    public async Task<SendMessageDto> BuildSendMessageDtoFromAdmin(Conference conference, Guid messageUuid, string message, string username, Guid participantId)
    {
        var fromUser = await userProfileService.GetUserAsync(username);
        var participant = conference.GetParticipant(participantId);
        var dto = new SendMessageDto()
        {
            Conference = conference,
            Timestamp = DateTime.UtcNow,
            MessageUuid = messageUuid,
            Message = message,
            From = username,
            FromDisplayName = fromUser.FirstName,
            To = participant.Id.ToString(),
            ParticipantUsername = participant.Username.ToLower()
        };

        return dto;
    }

    public static SendMessageDto BuildSendMessageDtoFromParticipant(Conference conference, Guid messageUuid,
        string message, string username)
    {
        var participant = conference.GetParticipant(username);
        var dto = new SendMessageDto()
        {
            Conference = conference,
            Timestamp = DateTime.UtcNow,
            MessageUuid = messageUuid,
            Message = message,
            From = username,
            FromDisplayName = participant.DisplayName,
            To = DefaultAdminName,
            ParticipantUsername = participant.Username.ToLower()
        };

        return dto;
    }
}
