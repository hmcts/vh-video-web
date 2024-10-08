using System;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Hub;
using VideoWeb.Helpers.Interfaces;
using System.Linq;
using VideoWeb.Contract.Request;
using VideoWeb.EventHub.Models;
using VideoWeb.Mappings;
using Hub = VideoWeb.EventHub.Hub;

namespace VideoWeb.Helpers;

public class EndpointsUpdatedEventNotifier(IHubContext<EventHub.Hub.EventHub, IEventHubClient> hubContext)
    : IEndpointsUpdatedEventNotifier
{
    public async Task PushEndpointsUpdatedEvent(Conference conference, UpdateConferenceEndpointsRequest endpointsToNotify)
    {
        var existingEndpoints = conference.Endpoints
            .Where(e => endpointsToNotify.ExistingEndpoints.Any(x => x.Id == e.Id))
            .Select(VideoEndpointsResponseMapper.Map);
        
        var newEndpoint = conference.Endpoints
            .Where(e => endpointsToNotify.NewEndpoints.Any(x => x.Id == e.Id))
            .Select(VideoEndpointsResponseMapper.Map);
        
        var endpoints = new UpdateEndpointsDto
        {
            ExistingEndpoints = existingEndpoints.ToList(),
            NewEndpoints = newEndpoint.ToList(),
            RemovedEndpoints = endpointsToNotify.RemovedEndpoints
        };
        
        foreach (var participant in conference.Participants.Where(participant => participant.Role != Role.StaffMember))
            await hubContext.Clients.Group(participant.Username.ToLowerInvariant()).EndpointsUpdated(conference.Id, endpoints);
        
        await hubContext.Clients.Group(Hub.EventHub.StaffMembersGroupName)
            .EndpointsUpdated(conference.Id, endpoints);
    }
    
    public async Task PushUnlinkedParticipantFromEndpoint(Guid conferenceId, string participant, string jvsEndpointName) =>
        await hubContext.Clients.Group(participant.ToLowerInvariant()).UnlinkedParticipantFromEndpoint(conferenceId, jvsEndpointName);
    
    public async Task PushLinkedNewParticipantToEndpoint(Guid conferenceId, string participant, string jvsEndpointName) =>
        await hubContext.Clients.Group(participant.ToLowerInvariant()).LinkedNewParticipantToEndpoint(conferenceId, jvsEndpointName);
    
    public async Task PushCloseConsultationBetweenEndpointAndParticipant(Guid conferenceId, string participant, string jvsEndpointName) =>
        await hubContext.Clients.Group(participant.ToLowerInvariant()).CloseConsultationBetweenEndpointAndParticipant(conferenceId, jvsEndpointName);
    
}
