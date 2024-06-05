using System.Collections.Generic;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using VideoApi.Client;
using VideoWeb.Common;
using VideoWeb.Common.Caching;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.EventHub.Handlers
{
    public class ParticipantsUpdatedEventHandler(
        IHubContext<Hub.EventHub, IEventHubClient> hubContext,
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
            foreach (var participant in participantsToNotify)
            {
                await HubContext.Clients.Group(participant.UserName.ToLowerInvariant())
                    .ParticipantsUpdatedMessage(SourceConferenceDto.Id, updatedParticipants);
                Logger.LogTrace("{UserName} | Role: {Role}", participant.UserName,
                    participant.Role);
            }

            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .ParticipantsUpdatedMessage(SourceConferenceDto.Id, updatedParticipants);
        }
    }
}
