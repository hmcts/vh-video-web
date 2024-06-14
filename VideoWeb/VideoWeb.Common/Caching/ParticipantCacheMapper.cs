using System;
using BookingsApi.Contract.V1.Responses;
using BookingsApi.Contract.V2.Responses;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Caching;

public static class ParticipantCacheMapper
{
    public static Participant Map(ParticipantDetailsResponse participant, ParticipantResponseV2 hearingDetails)
    {
        if(hearingDetails == null)
            return null;
        
        var model = new Participant();
        model.Id = participant.Id;
        model.RefId = participant.RefId;
        model.Name = participant.Name;
        model.FirstName = hearingDetails.FirstName;
        model.LastName = hearingDetails.LastName;
        model.ContactEmail = hearingDetails.ContactEmail;
        model.ContactTelephone = hearingDetails.TelephoneNumber;
        model.DisplayName = hearingDetails.DisplayName;
        model.Role = Enum.Parse<Role>(hearingDetails.UserRoleName, true);
        model.HearingRole = hearingDetails.HearingRoleName;
        model.ParticipantStatus = Enum.Parse<ParticipantStatus>(participant.CurrentStatus.ToString(), true);
        model.Username = hearingDetails.Username;
        model.CaseTypeGroup = participant.CaseTypeGroup;
        model.Representee = participant.Representee;
        model.CurrentRoomDto = RoomCacheMapper.Map(participant.CurrentRoom);
        model.InterpreterRoomDto = RoomCacheMapper.Map(participant.CurrentInterpreterRoom);
        return model;
    }
    public static Participant Map(ParticipantDetailsResponse participant, JudiciaryParticipantResponse judiciaryDetails)
    {
        if(judiciaryDetails == null)
            return null;
        
        var model = new Participant();
        model.Id = participant.Id;
        model.RefId = participant.RefId;
        model.Name = participant.Name;
        model.FirstName = judiciaryDetails.FirstName;
        model.LastName = judiciaryDetails.LastName;
        model.ContactEmail = judiciaryDetails.OptionalContactEmail;
        model.ContactTelephone = judiciaryDetails.OptionalContactTelephone;
        model.DisplayName = judiciaryDetails.DisplayName;
        model.Role = (Role)Enum.Parse(typeof(Role), participant.UserRole.ToString());
        model.HearingRole = judiciaryDetails.HearingRoleCode.ToString();
        model.ParticipantStatus = Enum.Parse<ParticipantStatus>(participant.CurrentStatus.ToString(), true);
        model.Username = judiciaryDetails.Email;
        model.CaseTypeGroup = participant.CaseTypeGroup;
        model.Representee = participant.Representee;
        model.CurrentRoomDto = RoomCacheMapper.Map(participant.CurrentRoom);
        model.InterpreterRoomDto = RoomCacheMapper.Map(participant.CurrentInterpreterRoom);
        return model;
    }
}
