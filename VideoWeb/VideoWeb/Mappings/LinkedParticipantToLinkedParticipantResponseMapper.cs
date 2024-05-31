using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using LinkedParticipantResponse = VideoWeb.Contract.Responses.LinkedParticipantResponse;

namespace VideoWeb.Mappings
{
    public class LinkedParticipantToLinkedParticipantResponseMapper : IMapTo<LinkedParticipant, LinkedParticipantResponse>
    {
        public LinkedParticipantResponse Map(LinkedParticipant input)
        {
            return new LinkedParticipantResponse()
            {
                LinkedId = input.LinkedId,
                LinkType = input.LinkType
            };
        }
    }
}
