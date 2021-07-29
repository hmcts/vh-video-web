using System;
using System.Collections.Generic;
using System.Linq;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class LinkedParticipantRequestToLinkedParticipantMapper : IMapTo<LinkedParticipantRequest, IEnumerable<Participant>, LinkedParticipant>
    {
        public LinkedParticipant Map(LinkedParticipantRequest linkedParticipant, IEnumerable<Participant> existingParticipants)
        {
            var existingParticipantId = existingParticipants.FirstOrDefault(x => x.RefId == linkedParticipant.LinkedRefId)?.Id;
            var mappedId = existingParticipantId != null ? existingParticipantId : linkedParticipant.LinkedRefId;

            return new LinkedParticipant()
            {
                LinkedId = (Guid)mappedId,
                LinkType = Enum.Parse<LinkType>(linkedParticipant.Type.ToString())
            };
        }
    }
}
