using VideoApi.Contract.Responses;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Generic;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Hub;
using VideoWeb.Helpers.Interfaces;
using System.Linq;
using Microsoft.Extensions.Logging;
using VideoWeb.Contract.Request;
using BookingsApi.Contract.Responses;
using VideoWeb.Mappings;
using VideoWeb.Contract.Responses;

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
            var videoEndpointResponseMapper = _mapperFactory.Get<VideoApi.Contract.Responses.EndpointResponse, int, VideoEndpointResponse>();
            var newEndpointsResponse = endpointsToNotify.NewEndpoints.Select(videoEndpointResponseMapper.Map).ToList();
            var existingEndpointsResponse = endpointsToNotify.ExistingEndpoints.Select(videoEndpointResponseMapper.Map).ToList();

            var endpoints = newEndpointsResponse.Concat(existingEndpointsResponse).ToList();

            foreach (var participant in conference.Participants)
            {
                await _hubContext.Clients.Group(participant.Username.ToLowerInvariant())
                    .EndpointsUpdated(conference.Id, endpoints);
            }
        }
    }
}
