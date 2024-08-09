using System;
using System.Collections.Generic;
using System.Linq;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;

namespace VideoWeb.Mappings;

public static class LinkedParticipantRequestToLinkedParticipantMapper
{
    public static LinkedParticipant Map(LinkedParticipantRequest linkedParticipant, IEnumerable<Participant> existingParticipants)
    {
        var existingParticipantId = existingParticipants.FirstOrDefault(x => x.RefId == linkedParticipant.LinkedRefId)?.Id;
        var mappedId = existingParticipantId ?? linkedParticipant.LinkedRefId;
        
        return new LinkedParticipant
        {
            LinkedId = mappedId,
            LinkType = Enum.Parse<LinkType>(linkedParticipant.Type.ToString())
        };
    }
}
