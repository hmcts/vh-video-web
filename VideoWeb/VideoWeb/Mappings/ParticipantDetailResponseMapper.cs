using System;
using System.Collections.Generic;
using System.Linq;
using BookingsApi.Contract.V2.Responses;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using JudiciaryParticipantResponse = BookingsApi.Contract.V1.Responses.JudiciaryParticipantResponse;
using ParticipantSummaryResponse = VideoApi.Contract.Responses.ParticipantSummaryResponse;

namespace VideoWeb.Mappings;

public class ParticipantDetailResponseMapper : IMapTo<IList<ParticipantResponseV2>, IList<JudiciaryParticipantResponse>, ICollection<ParticipantSummaryResponse>, List<ParticipantDetailsResponse>>
{
    public List<ParticipantDetailsResponse> Map(IList<ParticipantResponseV2> listParticipantsInHearing, IList<JudiciaryParticipantResponse> judiciaryParticipants, ICollection<ParticipantSummaryResponse> participantsInConference)
    {
        List<ParticipantDetailsResponse> list = new List<ParticipantDetailsResponse>();
        var linkParticipantMapper = new LinkedParticipantHearingResponseMapper();
        
        foreach (var participantInConference in participantsInConference)
        {
            var participantInHearing = listParticipantsInHearing.SingleOrDefault(x => x.ContactEmail == participantInConference.ContactEmail);
            if (participantInHearing != null)
            {
                var participantForUserResponse = new ParticipantDetailsResponse()
                {
                    FirstName = participantInHearing.FirstName,
                    LastName = participantInHearing.LastName,
                    RefId = participantInHearing.Id,
                    CurrentStatus = participantInConference.Status,
                    DisplayName = participantInHearing.DisplayName,
                    Id = participantInConference.Id,
                    UserRole = Enum.Parse<UserRole>(participantInHearing.UserRoleName),
                    HearingRole = participantInHearing.HearingRoleName,
                    Representee = participantInHearing.Representee,
                    CurrentRoom =participantInConference.CurrentRoom,
                    CurrentInterpreterRoom = participantInConference.CurrentInterpreterRoom,
                    LinkedParticipants = participantInHearing.LinkedParticipants.Select(linkParticipantMapper.Map).ToList(),
                    Username = participantInHearing.Username,
                    CaseTypeGroup = participantInConference.CaseGroup,
                    ContactEmail = participantInHearing.ContactEmail,
                    ContactTelephone = participantInHearing.TelephoneNumber
                };
                list.Add(participantForUserResponse);
            }
            else
            {
                var judiciaryParticipant = judiciaryParticipants.SingleOrDefault(x => x.Email == participantInConference.ContactEmail);
                if (judiciaryParticipant != null)
                {
                    var participantForUserResponse = new ParticipantDetailsResponse()
                    {
                        FirstName = judiciaryParticipant.FirstName,
                        LastName = judiciaryParticipant.LastName,
                        //RefId = judiciaryParticipant.,
                        CurrentStatus = participantInConference.Status,
                        DisplayName = judiciaryParticipant.DisplayName,
                        Id = participantInConference.Id,
                        //UserRole = ,
                        HearingRole = judiciaryParticipant.HearingRoleCode.ToString(),
                        Representee = null,
                        CurrentRoom = participantInConference.CurrentRoom,
                        CurrentInterpreterRoom = participantInConference.CurrentInterpreterRoom,
                        LinkedParticipants = null,
                        Username = judiciaryParticipant.Email,
                        CaseTypeGroup = participantInConference.CaseGroup,
                        ContactEmail = judiciaryParticipant.OptionalContactEmail,
                        ContactTelephone = judiciaryParticipant.OptionalContactTelephone
                    };
                    list.Add(participantForUserResponse);
                }
            }
        }
        return list;
    }
    
    
}
