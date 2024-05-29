using System;
using System.Collections.Generic;
using System.Linq;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using LinkedParticipantResponse = VideoApi.Contract.Responses.LinkedParticipantResponse;
using ParticipantSummaryResponse = VideoApi.Contract.Responses.ParticipantSummaryResponse;

namespace VideoWeb.Common.Caching;

public static class ParticipantCacheMapper
{
    public static Participant MapParticipantToCacheModel(ParticipantDetailsResponse participant)
    {
        var links = (participant.LinkedParticipants ?? new List<LinkedParticipantResponse>())
            .Select(MapLinkedParticipantToCacheModel).ToList();
        return new Participant
        {
            Id = participant.Id,
            RefId = participant.RefId,
            Name = participant.Name,
            FirstName = participant.FirstName,
            LastName = participant.LastName,
            ContactEmail = participant.ContactEmail,
            ContactTelephone = participant.ContactTelephone,
            DisplayName = participant.DisplayName,
            Role = Enum.Parse<Role>(participant.UserRole.ToString(), true),
            HearingRole = participant.HearingRole,
            ParticipantStatus = Enum.Parse<ParticipantStatus>(participant.CurrentStatus.ToString(), true),
            Username = participant.Username,
            CaseTypeGroup = participant.CaseTypeGroup,
            Representee = participant.Representee,
            LinkedParticipants = links
        };
        
        LinkedParticipant MapLinkedParticipantToCacheModel(
            LinkedParticipantResponse linkedParticipant)
        {
            return new LinkedParticipant
            {
                LinkedId = linkedParticipant.LinkedId,
                LinkType = Enum.Parse<LinkType>(linkedParticipant.Type.ToString(), true)
            };
        }
    }
    
    public static Participant MapParticipantToCacheModel(ParticipantSummaryResponse participant)
    {
        var links = (participant.LinkedParticipants ?? new List<LinkedParticipantResponse>())
            .Select(MapLinkedParticipantToCacheModel).ToList();
        return new Participant
        {
            Id = participant.Id,
            // RefId = participant.RefId,
            // Name = participant.,
            FirstName = participant.FirstName,
            LastName = participant.LastName,
            ContactEmail = participant.ContactEmail,
            ContactTelephone = participant.ContactTelephone,
            DisplayName = participant.DisplayName,
            Role = Enum.Parse<Role>(participant.UserRole.ToString(), true),
            HearingRole = participant.HearingRole,
            //ParticipantStatus = Enum.Parse<ParticipantStatus>(participant.CurrentStatus.ToString(), true),
            Username = participant.Username,
            //CaseTypeGroup = participant.CaseTypeGroup,
            Representee = participant.Representee,
            LinkedParticipants = links
        };
        
        LinkedParticipant MapLinkedParticipantToCacheModel(
            LinkedParticipantResponse linkedParticipant)
        {
            return new LinkedParticipant
            {
                LinkedId = linkedParticipant.LinkedId,
                LinkType = Enum.Parse<LinkType>(linkedParticipant.Type.ToString(), true)
            };
        }
    }
}
