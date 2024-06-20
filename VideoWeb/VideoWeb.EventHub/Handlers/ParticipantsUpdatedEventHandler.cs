using System.Collections.Generic;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using VideoApi.Client;
using VideoWeb.Common.Caching;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.EventHub.Handlers
{
    public class ParticipantsUpdatedEventHandler : EventHandlerBase
    {
        public ParticipantsUpdatedEventHandler(IHubContext<Hub.EventHubPPS2, IEventHubClient> hubContext,
            IConferenceCache conferenceCache, ILogger<EventHandlerBase> logger, IVideoApiClient videoApiClient) : base(
            hubContext, conferenceCache, logger, videoApiClient)
        {
        }

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
                    .ParticipantsUpdatedMessage(SourceConference.Id, updatedParticipants);
                Logger.LogTrace("{UserName} | Role: {Role}", participant.UserName,
                    participant.Role);
            }

            await HubContext.Clients.Group(Hub.EventHubPPS2.VhOfficersGroupName)
                .ParticipantsUpdatedMessage(SourceConference.Id, updatedParticipants);
        }
    }
}
