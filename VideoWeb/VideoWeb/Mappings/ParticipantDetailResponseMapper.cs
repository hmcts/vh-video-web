using System;
using System.Collections.Generic;
using System.Linq;
using BookingsApi.Contract.V2.Responses;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Mappings.Interfaces;
using JudiciaryParticipantResponse = BookingsApi.Contract.V1.Responses.JudiciaryParticipantResponse;
using ParticipantSummaryResponse = VideoApi.Contract.Responses.ParticipantSummaryResponse;

namespace VideoWeb.Mappings;

public class ParticipantDetailResponseMapper : IMapTo<IList<ParticipantResponseV2>, 
    IList<JudiciaryParticipantResponse>, 
    ICollection<ParticipantSummaryResponse>, 
    List<ParticipantDetailsResponse>>
{
    public List<ParticipantDetailsResponse> Map(IList<ParticipantResponseV2> input1, 
        IList<JudiciaryParticipantResponse> input2, 
        ICollection<ParticipantSummaryResponse> input3)
    {
        throw new NotImplementedException();
    }
    
    public List<Participant> Map(IList<ParticipantResponseV2> listParticipantsInHearing,
        IList<JudiciaryParticipantResponse> judiciaryParticipants,
        ICollection<ParticipantSummaryResponse> participantsInConference,
        List<ParticipantDetailsResponse> conferenceParticipants)
    {
        List<Participant> list = new List<Participant>();
        var linkParticipantMapper = new LinkedParticipantHearingResponseMapper();
        var roomMapper = new RoomResponseMapper();
        
        foreach (var participantInConference in participantsInConference)
        {
            var participantInHearing = listParticipantsInHearing.SingleOrDefault(x => x.ContactEmail == participantInConference.ContactEmail);
            var participantDetailsInConference = conferenceParticipants.SingleOrDefault(x => x.ContactEmail == participantInConference.ContactEmail);
            if (participantInHearing != null)
            {
                var participantForUserResponse = new Participant()
                {
                    FirstName = participantInHearing.FirstName,
                    LastName = participantInHearing.LastName,
                    RefId = participantDetailsInConference.RefId,
                    ParticipantStatus = Enum.Parse<ParticipantStatus>(participantInConference.Status.ToString()),
                    DisplayName = participantInHearing.DisplayName,
                    Id = participantInConference.Id,
                    Role = Enum.Parse<Role>(participantInHearing.UserRoleName),
                    HearingRole = participantInHearing.HearingRoleName,
                    Representee = participantInHearing.Representee,
                    CurrentRoom = roomMapper.Map(participantDetailsInConference.CurrentRoom),
                    CurrentInterpreterRoom = roomMapper.Map(participantDetailsInConference.CurrentInterpreterRoom),
                    LinkedParticipants = participantInHearing.LinkedParticipants.Select(linkParticipantMapper.Map).ToList(),
                    Username = participantInHearing.Username,
                    CaseTypeGroup = participantInConference.CaseGroup,
                    ContactEmail = participantInHearing.ContactEmail,
                    ContactTelephone = participantInHearing.TelephoneNumber,
                    Name = participantInHearing.FirstName + " " + participantInHearing.LastName
                };
                list.Add(participantForUserResponse);
            }
            else
            {
                var judiciaryParticipant = judiciaryParticipants.SingleOrDefault(x => x.Email == participantInConference.ContactEmail);
                if (judiciaryParticipant != null)
                {
                    var participantForUserResponse = new Participant()
                    {
                        FirstName = judiciaryParticipant.FirstName,
                        LastName = judiciaryParticipant.LastName,
                        RefId = participantDetailsInConference.RefId,
                        ParticipantStatus = Enum.Parse<ParticipantStatus>(participantInConference.Status.ToString()),
                        DisplayName = judiciaryParticipant.DisplayName,
                        Id = participantInConference.Id,
                        Role = Enum.Parse<Role>(judiciaryParticipant.HearingRoleCode.ToString()),
                        HearingRole = judiciaryParticipant.HearingRoleCode.ToString(),
                        Representee = null,
                        CurrentRoom = roomMapper.Map(participantDetailsInConference.CurrentRoom),
                        CurrentInterpreterRoom = roomMapper.Map(participantDetailsInConference.CurrentInterpreterRoom),
                        LinkedParticipants = null,
                        Username = judiciaryParticipant.Email,
                        CaseTypeGroup = participantInConference.CaseGroup,
                        ContactEmail = judiciaryParticipant.OptionalContactEmail,
                        ContactTelephone = judiciaryParticipant.OptionalContactTelephone,
                        Name = judiciaryParticipant.FirstName + " " + judiciaryParticipant.LastName
                    };
                    list.Add(participantForUserResponse);
                    list.Add(participantForUserResponse);
                }
            }
        }
        return list;
    }
    
   
}
