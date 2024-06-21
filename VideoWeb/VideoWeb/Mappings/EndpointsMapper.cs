using VideoWeb.Common.Models;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Responses;

namespace VideoWeb.Mappings
{
    public class EndpointsMapper : IMapTo<EndpointResponse, Endpoint>
    {
        public Endpoint Map(EndpointResponse endpoint)
        {
            return new Endpoint
            {
                DisplayName = endpoint.DisplayName,
                Id = endpoint.Id,
                EndpointStatus =  (EndpointStatus)((int)endpoint.Status),
                DefenceAdvocateUsername = endpoint.DefenceAdvocate,
                CurrentRoom = MapRoom(endpoint.CurrentRoom)
            };
        }
        
        private static ConsultationRoom MapRoom(RoomResponse room)
        {
            if (room == null) return null;

            return new ConsultationRoom
            {
                Label = room.Label,
                Locked = room.Locked
            };
        }
    }
}
