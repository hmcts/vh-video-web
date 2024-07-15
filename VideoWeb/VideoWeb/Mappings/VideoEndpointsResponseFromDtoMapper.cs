using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class VideoEndpointsResponseDtoMapper : IMapTo<Endpoint, VideoEndpointResponse>
    {
        private readonly IMapTo<ConsultationRoom, RoomSummaryResponse> _roomResponseMapper;
        public VideoEndpointsResponseDtoMapper(IMapTo<ConsultationRoom, RoomSummaryResponse> roomResponseMapper)
        {
            _roomResponseMapper = roomResponseMapper;
        }
        public VideoEndpointResponse Map(Endpoint endpoint)
        {
            var pexipDisplayName = $"PSTN;{endpoint.DisplayName};{endpoint.Id}";
            return new VideoEndpointResponse
            {
                DisplayName = endpoint.DisplayName,
                Id = endpoint.Id,
                Status = endpoint.EndpointStatus,
                PexipDisplayName = pexipDisplayName,
                CurrentRoom = _roomResponseMapper.Map(endpoint.CurrentRoom),
                DefenceAdvocateUsername = endpoint.DefenceAdvocateUsername,
                InterpreterLanguage = endpoint.InterpreterLanguage?.Map()
            };
        }
        

    }
}
