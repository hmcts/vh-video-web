using System;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Responses;

namespace VideoWeb.Mappings
{
    public class EndpointsResponseMapper : IMapTo<EndpointResponse, int, VideoEndpointResponse>
    {
        private readonly IMapTo<RoomResponse, RoomSummaryResponse> _roomResponseMapper;

        public EndpointsResponseMapper(IMapTo<RoomResponse, RoomSummaryResponse> roomResponseMapper)
        {
            _roomResponseMapper = roomResponseMapper;
        }

        public VideoEndpointResponse Map(EndpointResponse endpoint, int index)
        {
            var status = Enum.Parse<EndpointStatus>(endpoint.Status.ToString());
            var pexipDisplayName = $"T{100 + index};{endpoint.Display_name};{endpoint.Id}";
            return new VideoEndpointResponse
            {
                DisplayName = endpoint.Display_name,
                Id = endpoint.Id,
                Status = status,
                DefenceAdvocateUsername = endpoint.Defence_advocate,
                PexipDisplayName = pexipDisplayName,
                CurrentRoom = _roomResponseMapper.Map(endpoint.Current_room)
            };
        }
    }
}
