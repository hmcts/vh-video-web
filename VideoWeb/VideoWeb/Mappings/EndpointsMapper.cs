using System.Collections.Generic;
using System.Linq;
using BookingsApi.Contract.V2.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Responses;

namespace VideoWeb.Mappings
{
    public class EndpointsMapper : IMapTo<EndpointResponse, List<EndpointParticipantResponse>, EndpointDto>
    {
        public EndpointDto Map(EndpointResponse endpoint, List<EndpointParticipantResponse> linkedParticipants)
        {
            return new EndpointDto
            {
                DisplayName = endpoint.DisplayName,
                Id = endpoint.Id,
                EndpointStatus =  (EndpointStatus)(int)endpoint.Status,
                CurrentRoom = endpoint.CurrentRoom,
                EndpointParticipants = linkedParticipants.Select(x => new EndpointParticipant
                {
                    ParticipantUsername = x.ParticipantUsername,
                    LinkedParticipantType = (LinkType)(int)x.LinkedParticipantType
                }).ToList(),
            };
        }
    }
}
