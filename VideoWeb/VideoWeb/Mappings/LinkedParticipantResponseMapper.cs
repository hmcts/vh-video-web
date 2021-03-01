using System;
using VideoWeb.Common.Models;
using VideoWeb.Mappings.Interfaces;
using LinkedParticipantResponse = VideoWeb.Contract.Responses.LinkedParticipantResponse;
using VHLinkedParticipantResponse = VideoWeb.Services.Video.LinkedParticipantResponse;

namespace VideoWeb.Mappings
{
    public class LinkedParticipantResponseMapper : IMapTo<VHLinkedParticipantResponse, LinkedParticipantResponse>
    {
        public LinkedParticipantResponse Map(VHLinkedParticipantResponse input)
        {
            return new LinkedParticipantResponse
            {
                LinkedId = input.Linked_id,
                LinkType = Enum.Parse<LinkType>(input.Type.ToString())
            };
        }
    }
}
