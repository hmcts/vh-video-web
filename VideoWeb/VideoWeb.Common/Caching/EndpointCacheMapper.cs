using System;
using VideoWeb.Common.Models;
using VideoApi.Contract.Responses;

namespace VideoWeb.Common.Caching
{
    public static class EndpointCacheMapper
    {
        public static Endpoint MapEndpointToCacheModel(EndpointResponse endpointResponse)
        {
            return new Endpoint
            {
                Id = endpointResponse.Id,
                DisplayName = endpointResponse.DisplayName,
                EndpointStatus = (EndpointStatus) Enum.Parse(typeof(EndpointStatus), endpointResponse.Status.ToString()),
                DefenceAdvocateUsername = endpointResponse.DefenceAdvocate,
                CurrentRoom = MapRoom(endpointResponse.CurrentRoom)
            };
        }
        private static ConsultationRoom MapRoom(RoomResponse room)
        {
            if (room == null) return null;
            
            return new ConsultationRoom
            {
                Id = room.Id,
                Label = room.Label,
                Locked = room.Locked
            };
        }
    }
    
}
