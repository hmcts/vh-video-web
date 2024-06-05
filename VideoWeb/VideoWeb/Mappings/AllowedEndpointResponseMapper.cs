using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class AllowedEndpointResponseMapper : IMapTo<EndpointDto, AllowedEndpointResponse>
    {
        public AllowedEndpointResponse Map(EndpointDto input)
        {
            return new AllowedEndpointResponse
            {
                DisplayName = input.DisplayName,
                Id = input.Id,
                EndpointParticipants = input.EndpointParticipants.Select(x => new EndpointParticipantResponse
                {
                    ParticipantUsername = x.ParticipantUsername,
                    LinkType = x.LinkedParticipantType
                }).ToList()
            };
        }
    }
}
