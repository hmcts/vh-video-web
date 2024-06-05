using System.Linq;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class ConferenceDtoMapper : IMapTo<ConferenceDetailsResponse, ConferenceDto>
    {
        private readonly IMapTo<ParticipantDetailsResponse, ParticipantDto> _participantDetailsResponseMapper;
        private readonly IMapTo<EndpointResponse, EndpointDto> _endpointMapper;

        public ConferenceDtoMapper(IMapTo<ParticipantDetailsResponse, ParticipantDto> participantDetailsResponseMapper, IMapTo<EndpointResponse, EndpointDto> endpointResponseMapper)
        {
            _participantDetailsResponseMapper = participantDetailsResponseMapper;
            _endpointMapper = endpointResponseMapper;
        }

        public ConferenceDto Map(ConferenceDetailsResponse conference)
        {
            return new ConferenceDto
            {
                Id = conference.Id,
                Participants = conference.Participants.Select(_participantDetailsResponseMapper.Map).ToList(),
                Endpoints = conference.Endpoints.Select(_endpointMapper.Map).ToList()
            };
        }
    }
}
