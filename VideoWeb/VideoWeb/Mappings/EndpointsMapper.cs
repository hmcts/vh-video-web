using System.Linq;
using BookingsApi.Contract.V2.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Responses;

namespace VideoWeb.Mappings
{
    public class EndpointsMapper : IMapTo<EndpointResponse, Endpoint>
    {
        public Endpoint Map(EndpointResponse endpoint, EndpointParticipantResponse[] linkedParticipants)
        {
            return new Endpoint
            {
                DisplayName = endpoint.DisplayName,
                Id = endpoint.Id,
                EndpointStatus =  (EndpointStatus)(int)endpoint.Status,
                EndpointParticipants = linkedParticipants.Select(x => new EndpointParticipant
                {
                    ParticipantUsername = x.ParticipantUsername,
                    LinkedParticipantType = (LinkType)(int)x.LinkedParticipantType
                }).ToList(),
            };
        }
    }
}
