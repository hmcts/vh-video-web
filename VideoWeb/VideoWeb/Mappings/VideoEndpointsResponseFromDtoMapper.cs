using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

using VideoApi.Contract.Responses;
namespace VideoWeb.Mappings
{
    public class VideoEndpointsResponseDtoMapper : IMapTo<EndpointDto, VideoEndpointResponse>
    {
        private readonly IMapTo<RoomResponse, RoomSummaryResponse> _roomResponseMapper;
        public VideoEndpointsResponseDtoMapper(IMapTo<RoomResponse, RoomSummaryResponse> roomResponseMapper)
        {
            _roomResponseMapper = roomResponseMapper;
        }
        public VideoEndpointResponse Map(EndpointDto endpointDto)
        {
            var pexipDisplayName = $"PSTN;{endpointDto.DisplayName};{endpointDto.Id}";
            return new VideoEndpointResponse
            {
                DisplayName = endpointDto.DisplayName,
                Id = endpointDto.Id,
                Status = endpointDto.EndpointStatus,
                PexipDisplayName = pexipDisplayName,
                CurrentRoom = _roomResponseMapper.Map(endpointDto.CurrentRoom),
                EndpointParticipants = endpointDto.EndpointParticipants?.Select(x => new EndpointParticipantResponse
                {
                    ParticipantUsername = x.ParticipantUsername,
                    LinkType = x.LinkedParticipantType
                }).ToList()
            };
        }
        

    }
}
