using System;
using BookingsApi.Contract.V1.Responses;
using BookingsApi.Contract.V2.Responses;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Caching;

public static class ParticipantCacheMapper
{
       /// <summary>
    /// Regular participant mapping to DTO
    /// </summary>
    /// <param name="participant"></param>
    /// <param name="hearingDetails"></param>
    /// <returns></returns>
    public static Participant Map(ParticipantDetailsResponse participant, ParticipantResponseV2 hearingDetails)
    {
        if(hearingDetails == null)
            return null;
        
        var model = new Participant();
        model.Id = participant.Id;
        model.RefId = participant.RefId;
        model.FirstName = hearingDetails.FirstName;
        model.LastName = hearingDetails.LastName;
        model.Name = participant.Name;
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
    public static Participant Map(ParticipantDetailsResponse participant, JudiciaryParticipantResponse judiciaryDetails)
    {
        if(judiciaryDetails == null)
            return null;
        
        var model = new Participant();
        model.Id = participant.Id;
        model.RefId = participant.RefId;
        model.FirstName = judiciaryDetails.FirstName;
        model.LastName = judiciaryDetails.LastName;
        model.Name = participant.Name;
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
    public static Participant Map(ParticipantDetailsResponse participant)
    {
        var model = new Participant();
        model.Id = participant.Id;
        model.RefId = participant.RefId;
        model.Name = participant.Name;
        model.DisplayName = participant.DisplayName;
        model.Role = Enum.Parse<Role>(participant.UserRole.ToString(), true);
        model.ParticipantStatus = Enum.Parse<ParticipantStatus>(participant.CurrentStatus.ToString(), true);
        model.Username = participant.Username;
        model.HearingRole = participant.HearingRole;
        model.Role = (Role)Enum.Parse(typeof(Role), participant.UserRole.ToString());
        model.CurrentRoom = RoomCacheMapper.Map(participant.CurrentRoom);
        model.InterpreterRoom = RoomCacheMapper.Map(participant.CurrentInterpreterRoom);
        return model;
    } 
}
