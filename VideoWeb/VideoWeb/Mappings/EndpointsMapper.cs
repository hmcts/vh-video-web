using System.Collections.Generic;
using System.Linq;
using BookingsApi.Contract.V2.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Responses;

namespace VideoWeb.Mappings
{
    public class EndpointsMapper : IMapTo<EndpointResponse, List<EndpointParticipantResponse>, Endpoint>
    {
        public Endpoint Map(EndpointResponse endpoint, List<EndpointParticipantResponse> linkedParticipants)
        {
            var endpointDto = new Endpoint
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
            if(endpoint.CurrentRoom != null)
            {
                endpointDto.CurrentRoom = new MeetingRoomDto
                {
                    Id = endpoint.CurrentRoom.Id,
                    Label = endpoint.CurrentRoom.Label,
                    Locked = endpoint.CurrentRoom.Locked
                };
            }
            return endpointDto;
        }
    }
}
