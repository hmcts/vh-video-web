using System;
using System.Collections.Generic;
using System.Linq;
using BookingsApi.Contract.V2.Responses;
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

        public VideoEndpointResponse Map(EndpointResponse endpoint, List<EndpointParticipantResponse> linkedParticipants)
        {
            var status = Enum.Parse<EndpointStatus>(endpoint.Status.ToString());
            var pexipDisplayName = $"PSTN;{endpoint.DisplayName};{endpoint.Id}";
            return new VideoEndpointResponse
            {
                DisplayName = endpoint.DisplayName,
                Id = endpoint.Id,
                Status = status,
                PexipDisplayName = pexipDisplayName,
                CurrentRoom = _roomResponseMapper.Map(endpoint.CurrentRoom),
                EndpointParticipants = linkedParticipants.Select(x => new EndpointParticipant
                {
                    ParticipantUsername = x.ParticipantUsername,
                    LinkedParticipantType = Enum.Parse<LinkType>(x.LinkedParticipantType.ToString())
                }).ToList()
                
            };
        }
    }
}
