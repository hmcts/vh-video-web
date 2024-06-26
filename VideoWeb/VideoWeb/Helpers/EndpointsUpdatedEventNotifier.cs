using System;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Hub;
using VideoWeb.Helpers.Interfaces;
using System.Linq;
using VideoWeb.Contract.Request;
using VideoWeb.Mappings;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Models;

namespace VideoWeb.Helpers
{
    public class EndpointsUpdatedEventNotifier : IEndpointsUpdatedEventNotifier
    {
        private readonly IHubContext<VideoWeb.EventHub.Hub.EventHub, IEventHubClient> _hubContext;
        private readonly IMapperFactory _mapperFactory;

        public EndpointsUpdatedEventNotifier(IHubContext<EventHub.Hub.EventHub, IEventHubClient> hubContext, IMapperFactory mapperFactory)
        {
            _hubContext = hubContext;
            _mapperFactory = mapperFactory;
        }

        public async Task PushEndpointsUpdatedEvent(Conference conference, UpdateConferenceEndpointsRequest endpointsToNotify)
        {
            var videoEndpointResponseMapper = _mapperFactory.Get<Endpoint, VideoEndpointResponse>();
            
            var existingEndpoints = conference.Endpoints
                .Where(e => endpointsToNotify.ExistingEndpoints.Any(x => x.Id == e.Id))
                .Select(videoEndpointResponseMapper.Map);
            
            var newEndpoint = conference.Endpoints
                .Where(e => endpointsToNotify.NewEndpoints.Any(x => x.Id == e.Id))
                .Select(videoEndpointResponseMapper.Map);
            
            var endpoints = new UpdateEndpointsDto
            {
                ExistingEndpoints = existingEndpoints.ToList(),
                NewEndpoints = newEndpoint.ToList(),
                RemovedEndpoints = endpointsToNotify.RemovedEndpoints
            };

            foreach (var participant in conference.Participants)
                await _hubContext.Clients.Group(participant.Username.ToLowerInvariant()).EndpointsUpdated(conference.Id, endpoints);
            
        }

        public async Task PushUnlinkedParticipantFromEndpoint(Guid conferenceId, string participant, string jvsEndpointName) => 
            await _hubContext.Clients.Group(participant.ToLowerInvariant()).UnlinkedParticipantFromEndpoint(conferenceId, jvsEndpointName);
        
        public async Task PushLinkedNewParticipantToEndpoint(Guid conferenceId, string participant, string jvsEndpointName) =>
            await _hubContext.Clients.Group(participant.ToLowerInvariant()).LinkedNewParticipantToEndpoint(conferenceId, jvsEndpointName);

        public async Task PushCloseConsultationBetweenEndpointAndParticipant(Guid conferenceId, string participant, string jvsEndpointName) =>
            await _hubContext.Clients.Group(participant.ToLowerInvariant()).CloseConsultationBetweenEndpointAndParticipant(conferenceId, jvsEndpointName);
        
    }
}
