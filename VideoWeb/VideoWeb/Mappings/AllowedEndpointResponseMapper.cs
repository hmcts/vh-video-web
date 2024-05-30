using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using EndpointParticipant = VideoWeb.Contract.Responses.EndpointParticipant;

namespace VideoWeb.Mappings
{
    public class AllowedEndpointResponseMapper : IMapTo<Endpoint, AllowedEndpointResponse>
    {
        public AllowedEndpointResponse Map(Endpoint input)
        {
            return new AllowedEndpointResponse
            {
                DisplayName = input.DisplayName,
                Id = input.Id,
                EndpointParticipants = input.EndpointParticipants.Select(x => new EndpointParticipant
                {
                    ParticipantUsername = x.ParticipantUsername,
                    LinkType = x.LinkedParticipantType
                }).ToList()
            };
        }
    }
}
