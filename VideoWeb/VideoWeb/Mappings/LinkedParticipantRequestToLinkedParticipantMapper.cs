using System;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class LinkedParticipantRequestToLinkedParticipantResponse : IMapTo<LinkedParticipantRequest, LinkedParticipant>
    {
        public LinkedParticipant Map(LinkedParticipantRequest input)
        {
            return new LinkedParticipant()
            {
                LinkedId = input.LinkedRefId,
                LinkType = Enum.Parse<LinkType>(input.Type.ToString())
            };
        }
    }
}
