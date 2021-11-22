using System;
using System.Linq;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Mappings.Interfaces;
using ConferenceForHostResponse = VideoApi.Contract.Responses.ConferenceForHostResponse;

namespace VideoWeb.Mappings
{
    public class ConferenceDetailsResponseMapper : IMapTo<ConferenceDetailsResponse, Conference>
    {
        private readonly IMapTo<ParticipantDetailsResponse, Participant> _participantDetailsResponseMapper;
        private readonly IMapTo<EndpointResponse, Endpoint> _endpointResponseMapper;

        public ConferenceDetailsResponseMapper(IMapTo<ParticipantDetailsResponse, Participant> participantDetailsResponseMapper, IMapTo<EndpointResponse, Endpoint> endpointResponseMapper)
        {
            _participantDetailsResponseMapper = participantDetailsResponseMapper;
            _endpointResponseMapper = endpointResponseMapper;
        }

        public Conference Map(ConferenceDetailsResponse conference)
        {
            return new Conference
            {
                Id = conference.Id,
                Participants = conference.Participants.Select(_participantDetailsResponseMapper.Map).ToList(),
                Endpoints = conference.Endpoints.Select(_endpointResponseMapper.Map).ToList()
            };
        }
    }
}
