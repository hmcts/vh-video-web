using System;
using VideoWeb.Common.Models;
using VideoWeb.Mappings.Interfaces;
using LinkedParticipantResponse = VideoWeb.Contract.Responses.LinkedParticipantResponse;
using VHLinkedParticipantResponse = VideoApi.Contract.Responses.LinkedParticipantResponse;

namespace VideoWeb.Mappings
{
    public class LinkedParticipantResponseMapper : IMapTo<VHLinkedParticipantResponse, LinkedParticipantResponse>
    {
        public LinkedParticipantResponse Map(VHLinkedParticipantResponse input)
        {
            return new LinkedParticipantResponse
            {
                LinkedId = input.LinkedId,
                LinkType = Enum.Parse<LinkType>(input.Type.ToString())
            };
        }
    }
}
