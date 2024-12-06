using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.EventHub.Handlers;

public class ParticipantsUpdatedEventHandler(
    IHubContext<Hub.EventHubVIH11189, IEventHubClient> hubContext,
    IConferenceService conferenceService,
    ILogger<EventHandlerBase> logger)
    : EventHandlerBase(hubContext, conferenceService, logger)
{
    
    public override EventType EventType => EventType.ParticipantsUpdated;
    
    protected override Task PublishStatusAsync(CallbackEvent callbackEvent)
    {
        return PublishParticipantsUpdatedMessage(callbackEvent.Participants, callbackEvent.ParticipantsToNotify);
    }
    
    private async Task PublishParticipantsUpdatedMessage(List<ParticipantResponse> updatedParticipants,
        List<ParticipantResponse> participantsToNotify)
    {
        foreach (var participant in participantsToNotify.Where(p => p.Role != Role.StaffMember))
        {
            await HubContext.Clients.Group(participant.UserName.ToLowerInvariant())
                .ParticipantsUpdatedMessage(SourceConference.Id, updatedParticipants);
            Logger.LogTrace("{UserName} | Role: {Role}", participant.UserName,
                participant.Role);
        }
        
        await HubContext.Clients.Group(Hub.EventHubVIH11189.VhOfficersGroupName)
            .ParticipantsUpdatedMessage(SourceConference.Id, updatedParticipants);
        
        await HubContext.Clients.Group(Hub.EventHubVIH11189.StaffMembersGroupName)
            .ParticipantsUpdatedMessage(SourceConference.Id, updatedParticipants);
    }
}
