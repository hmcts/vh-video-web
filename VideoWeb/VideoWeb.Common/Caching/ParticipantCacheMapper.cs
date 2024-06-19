using System;
using BookingsApi.Contract.V1.Responses;
using BookingsApi.Contract.V2.Responses;
using VideoApi.Contract.Enums;
using VideoWeb.Common.Models;
using ParticipantResponse = VideoApi.Contract.Responses.ParticipantResponse;

namespace VideoWeb.Common.Caching;

public static class ParticipantCacheMapper
{
    /// <summary>
    /// Regular participant mapping to DTO
    /// </summary>
    /// <param name="participant"></param>
    /// <param name="hearingDetails"></param>
    /// <returns></returns>
    public static Participant Map(ParticipantResponse participant, ParticipantResponseV2 hearingDetails)
    {
        if(hearingDetails == null)
            return null;
        
        var model = new Participant();
        model.Id = participant.Id;
        model.RefId = participant.RefId;
        model.FirstName = hearingDetails.FirstName;
        model.LastName = hearingDetails.LastName;
        model.FullTitledName = $"{hearingDetails.Title} {hearingDetails.FirstName} {hearingDetails.LastName}";
        model.ContactEmail = hearingDetails.ContactEmail;
        model.ContactTelephone = hearingDetails.TelephoneNumber;
        model.DisplayName = hearingDetails.DisplayName;
        model.Role = Enum.Parse<Role>(hearingDetails.UserRoleName, true);
        model.HearingRole = hearingDetails.HearingRoleName;
        model.ParticipantStatus = Enum.Parse<ParticipantStatus>(participant.CurrentStatus.ToString(), true);
        model.Username = hearingDetails.Username;
        model.Representee = hearingDetails.Representee;
        model.CurrentRoom = RoomCacheMapper.Map(participant.CurrentRoom);
        model.InterpreterRoom = RoomCacheMapper.Map(participant.CurrentInterpreterRoom);
        return model;
    }
    
    /// <summary>
    /// JudiciaryParticipant mapping to DTO
    /// </summary>
    /// <param name="participant"></param>
    /// <param name="judiciaryDetails"></param>
    /// <returns></returns>
    public static Participant Map(ParticipantResponse participant, JudiciaryParticipantResponse judiciaryDetails)
    {
        if(judiciaryDetails == null)
            return null;
        
        var model = new Participant();
        model.Id = participant.Id;
        model.RefId = participant.RefId;
        model.FirstName = judiciaryDetails.FirstName;
        model.LastName = judiciaryDetails.LastName;
        model.FullTitledName = judiciaryDetails.FullName;
        model.ContactEmail = judiciaryDetails.OptionalContactEmail;
        model.ContactTelephone = judiciaryDetails.OptionalContactTelephone;
        model.DisplayName = judiciaryDetails.DisplayName;
        model.Role = (Role)Enum.Parse(typeof(Role), participant.UserRole.ToString());
        model.HearingRole = judiciaryDetails.HearingRoleCode.ToString();
        model.ParticipantStatus = Enum.Parse<ParticipantStatus>(participant.CurrentStatus.ToString(), true);
        model.Username = judiciaryDetails.Email;
        model.CurrentRoom = RoomCacheMapper.Map(participant.CurrentRoom);
        model.InterpreterRoom = RoomCacheMapper.Map(participant.CurrentInterpreterRoom);
        return model;
    }
    
    /// <summary>
    /// QuicklinkParticipant mapping to DTO
    /// </summary>
    public static Participant Map(ParticipantResponse participant)
    {
        var model = new Participant();
        model.Id = participant.Id;
        model.RefId = participant.RefId;
        model.DisplayName = participant.DisplayName;
        model.Role = Enum.Parse<Role>(participant.UserRole.ToString(), true);
        model.HearingRole = GetHearingRoleFromUserRole(participant.UserRole);
        model.ParticipantStatus = Enum.Parse<ParticipantStatus>(participant.CurrentStatus.ToString(), true);
        model.Username = participant.Username;
        model.CurrentRoom = RoomCacheMapper.Map(participant.CurrentRoom);
        model.InterpreterRoom = RoomCacheMapper.Map(participant.CurrentInterpreterRoom);
        return model;
    }
    
    private static string GetHearingRoleFromUserRole(UserRole userRole) 
        => userRole switch
        {
            UserRole.StaffMember => "Staff Member",
            UserRole.QuickLinkObserver => "Quick Link Observer",
            UserRole.QuickLinkParticipant => "Quick Link Participant",
            _ => null
        };
}
