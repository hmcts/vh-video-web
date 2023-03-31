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
            var videoEndpointResponseMapper = _mapperFactory.Get<VideoApi.Contract.Responses.EndpointResponse, int, VideoEndpointResponse>();

            var endpoints = new UpdateEndpointsDto
            {
                ExistingEndpoints = endpointsToNotify.ExistingEndpoints.Select(videoEndpointResponseMapper.Map).ToList(),
                NewEndpoints = endpointsToNotify.NewEndpoints.Select(videoEndpointResponseMapper.Map).ToList(),
                RemovedEndpoints = endpointsToNotify.RemovedEndpoints
            };

            foreach (var participant in conference.Participants)
            {
                await _hubContext.Clients.Group(participant.Username.ToLowerInvariant())
                    .EndpointsUpdated(conference.Id, endpoints);
            }
            
            // TODO: check with team with the VHO needs this event
        }
    }
}
