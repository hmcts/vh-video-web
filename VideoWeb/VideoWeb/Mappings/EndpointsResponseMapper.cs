using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using BookingApi = BookingsApi.Contract.V2.Responses;

using VideoApi.Contract.Responses;
namespace VideoWeb.Mappings
{
    public class EndpointsResponseMapper : IMapTo<EndpointResponse, List<BookingApi.EndpointParticipantResponse>, VideoEndpointResponse>
    {
        private readonly IMapTo<RoomResponse, RoomSummaryResponse> _roomResponseMapper;

        public VideoEndpointResponse Map(EndpointResponse endpoint, List<BookingApi.EndpointParticipantResponse> linkedParticipants)
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
                EndpointParticipants = linkedParticipants.Select(x => new EndpointParticipantResponse
                {
                    ParticipantUsername = x.ParticipantUsername,
                    LinkType = (LinkType)x.LinkedParticipantType
                }).ToList()
                
            };
        }
        
        public EndpointsResponseMapper(IMapTo<RoomResponse, RoomSummaryResponse> roomResponseMapper)
        {
            _roomResponseMapper = roomResponseMapper;
        }
    }
}
