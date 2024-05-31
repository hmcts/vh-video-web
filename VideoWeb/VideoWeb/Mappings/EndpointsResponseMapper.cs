using System;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Responses;
using RoomResponse = VideoApi.Contract.Responses.RoomResponse;

namespace VideoWeb.Mappings
{
    public class EndpointsResponseMapper : IMapTo<EndpointResponse, int, VideoEndpointResponse>
    {
        private readonly IMapTo<RoomResponse, Common.Models.RoomResponse> _roomResponseMapper;

        public EndpointsResponseMapper(IMapTo<RoomResponse, Common.Models.RoomResponse> roomResponseMapper)
        {
            _roomResponseMapper = roomResponseMapper;
        }

        public VideoEndpointResponse Map(EndpointResponse endpoint, int index)
        {
            var status = Enum.Parse<EndpointStatus>(endpoint.Status.ToString());
            var pexipDisplayName = $"PSTN;{endpoint.DisplayName};{endpoint.Id}";
            return new VideoEndpointResponse
            {
                DisplayName = endpoint.DisplayName,
                Id = endpoint.Id,
                Status = status,
                DefenceAdvocateUsername = endpoint.DefenceAdvocate,
                PexipDisplayName = pexipDisplayName,
                CurrentRoom = _roomResponseMapper.Map(endpoint.CurrentRoom)
            };
        }
    }
}
