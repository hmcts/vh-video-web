using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.EventHub.Handlers;

public class ParticipantsUpdatedEventHandler : EventHandlerBase
{
    public override EventType EventType => EventType.ParticipantsUpdated;

    public ParticipantsUpdatedEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext,
        IConferenceService conferenceService,
        ILogger<EventHandlerBase> logger)
        : base(hubContext, conferenceService, logger)
    {
    }
    
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
        
        await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
            .ParticipantsUpdatedMessage(SourceConference.Id, updatedParticipants);
        
        await HubContext.Clients.Group(Hub.EventHub.StaffMembersGroupName)
            .ParticipantsUpdatedMessage(SourceConference.Id, updatedParticipants);
    }
}
