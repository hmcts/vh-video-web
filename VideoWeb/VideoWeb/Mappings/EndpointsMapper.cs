using System.Collections.Generic;
using System.Linq;
using BookingsApi.Contract.V2.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Responses;

namespace VideoWeb.Mappings
{
    public class EndpointsMapper : IMapTo<EndpointResponse, Endpoint>
    {
        public Endpoint Map(EndpointResponse endpoint)
        {
            var endpointDto = new Endpoint
            {
                DisplayName = endpoint.DisplayName,
                Id = endpoint.Id,
                EndpointStatus =  (EndpointStatus)(int)endpoint.Status,
                DefenceAdvocate = endpoint.DefenceAdvocate
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
