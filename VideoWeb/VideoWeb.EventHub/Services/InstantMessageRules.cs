using System;
using System.Threading.Tasks;
using VideoWeb.Common;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Models;

namespace VideoWeb.EventHub.Services;

public class InstantMessageRules
{
    public static string DefaultAdminName => "Admin";
    private readonly IUserProfileService _userProfileService;

    public InstantMessageRules(IUserProfileService userProfileService)
    {
        _userProfileService = userProfileService;
    }

    /// <summary>
    /// Check if the one side is in the conference and the other is an Admin or a staff member admin privileges
    /// </summary>
    /// <param name="conferenceDto"></param>
    /// <param name="to">This is either the DefaultAdminName or a string representation of a participant ID (GUID)</param>
    /// <param name="from">the username of the sender</param>
    /// <returns>true if the conversation is permitted</returns>
    public async Task<bool> CanExchangeMessage(ConferenceDto conferenceDto, string to, string from)
    {
        var isFromParticipant = conferenceDto.IsParticipantInConference(from);
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
        if(!conferenceDto.Participants.Exists(p => p.Id == toGuid))
        {
            return false;
        }
        
        // if the recipient is a participant, sender must be an admin (note: staff members who can access the CC have the admin role too)
        var fromUser = await _userProfileService.GetUserAsync(from);
        return fromUser.IsAdmin;
    }

    public async Task<SendMessageDto> BuildSendMessageDtoFromAdmin(ConferenceDto conferenceDto, Guid messageUuid, string message, string username, Guid participantId)
    {
        var fromUser = await _userProfileService.GetUserAsync(username);
        var participant = conferenceDto.GetParticipant(participantId);
        var dto = new SendMessageDto()
        {
            ConferenceDto = conferenceDto,
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

    public SendMessageDto BuildSendMessageDtoFromParticipant(ConferenceDto conferenceDto, Guid messageUuid,
        string message, string username)
    {
        var participant = conferenceDto.GetParticipant(username);
        var dto = new SendMessageDto()
        {
            ConferenceDto = conferenceDto,
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
